import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Context, LogEntry } from "../../lib/system/context";
import Updater, { UpdateProgress } from "@pcsmw/node-app-updater";
import { sleep } from "../../lib/utils";
import { Telegram } from "../../lib/interfaces/telegram";

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

router.post('/update', async (req: Request, res: Response, next: NextFunction) => {
    const updater = new Updater();


    if (await updater.isNewerVersionAvailable(Context.it.installedVersion)) {
        res.status(200);
        res.chunkedEncoding = true;
        res.write(JSON.stringify({ ok: true, message: 'Neue Version wird heruntergeladen.' }));

        const iterator = updater.update();
        let done = false;
        do {
            let result;
            try {
                result = await iterator.next();
            } catch (e) {
                await sleep(100);
                res.end(JSON.stringify({ ok: false, message: e.message }));
                break;
            }

            done = result.done ?? true;
            switch (result.value) {
                case UpdateProgress.DownloadedLatestVersion:
                    res.write(JSON.stringify({ ok: true, message: 'Neuste Version heruntergeladen.' }));
                    await sleep(50);
                    res.write(JSON.stringify({ ok: true, message: 'Abhängigkeiten werden installiert.' }));
                    break;
                case UpdateProgress.InstalledDependecies:
                    res.write(JSON.stringify({ ok: true, message: 'Abhängigkeiten wurden installiert.' }));
                    await sleep(50);
                    res.write(JSON.stringify({ ok: true, message: 'Anwendung wird installiert.' }));
                    break;
                case UpdateProgress.InstalledApplication:
                    res.write(JSON.stringify({ ok: true, message: 'Anwendung wurde installiert.' }));
                    await sleep(50);
                    res.end(JSON.stringify({ ok: true, message: 'Anwendung wird neu gestartet.' }));
                    break;
                case UpdateProgress.DownloadedLatestVersion:
                    break;
            }

        } while (!done);

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

