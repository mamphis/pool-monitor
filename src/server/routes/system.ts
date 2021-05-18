import { NextFunction, Request, Response, Router } from "express";
import { Context } from "../../lib/system/context";
import { installApplication, installDependencies, newerVersionAvailable, pullLatestVersion, restartApplication } from "../../lib/system/update";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('system', {
        versionInfo: Context.it.versionInfo,
    });
});

router.post('/update', async (req: Request, res: Response, next: NextFunction) => {
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

