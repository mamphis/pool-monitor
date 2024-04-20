import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Telegram } from "../../lib/interfaces/telegram";
import { Context, LogEntry } from "../../lib/system/context";
import { sleep } from "../../lib/utils";
import { installApplication, installDependencies, newerVersionAvailable, pullLatestVersion, restartApplication } from "../../lib/system/update";

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    return res.render('system', {
        telegramLink: await Telegram.it.getTelegramLink(res.locals.user.name),
        versionInfo: Context.it.versionInfo,
        logEntries: Context.it.devices.reduce((prev, curr) => {
            prev.push(...curr.log.map(l => {
                return {
                    name: curr.name,
                    ...l,
                };
            }));
            return prev;
        }, [] as (LogEntry & { name: string })[]).sort((a, b) => b.timestamp - a.timestamp).map(l => {
            return {
                ...l,
                timestamp: moment(new Date(l.timestamp)).format('DD.MM.YYYY HH:mm:ss')
            }
        }),
    });
});

router.post('/user', async (req: Request, res: Response, next: NextFunction) => {
    let { notificationEnabled, notificationMuted } = req.body;

    if (!notificationEnabled) {
        notificationMuted = false;
    }

    Context.it.updateUser(res.locals.user.name, { notificationMuted, notificationEnabled });

    res.json(Context.it.users[res.locals.user.name]);
});

router.post('/update', async (req: Request, res: Response, next: NextFunction) => {

    res.status(200);
    res.chunkedEncoding = true;
    res.write(JSON.stringify({ ok: true, message: 'Neue Version wird heruntergeladen.' }));
    if (await newerVersionAvailable()) {
        res.status(200);
        res.chunkedEncoding = true;
        res.write(JSON.stringify({ ok: true, message: 'Neue Version wird heruntergeladen.' }));
        await pullLatestVersion();
        res.write(JSON.stringify({ ok: true, message: 'Abhängigkeiten werden installiert.' }));
        await installDependencies();
        res.write(JSON.stringify({ ok: true, message: 'Anwendung wird installiert.' }));
        await installApplication();
        res.end(JSON.stringify({ ok: true, message: 'Anwendung wird neu gestartet.' }));
        restartApplication();
        return;
    }

    return res.status(400).json({ ok: false, message: 'Keine neuere Version verfügbar.' })
});

router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
    await Context.it.updateVersionInfo();
    const versionInfo = Context.it.versionInfo;
    res.json({
        installedVersion: versionInfo.installedVersion,
        latestVersion: versionInfo.latestVersion,
        lastChecked: versionInfo.lastChecked.format('DD.MM.yyyy HH:mm:ss'),
    });
});

export { router as systemRouter };

