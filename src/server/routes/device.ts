import { NextFunction, Request, Response, Router } from "express";
import { IO } from "../../lib/peripherals/io";
import { TemperatureSensorManager } from "../../lib/peripherals/temperature";
import { Context } from "../../lib/system/context";
import { systemData } from "../../lib/utils";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('device', { state: Context.it.lastIOStates, updateInterval: Context.it.updateInterval, system: JSON.stringify(systemData()) });
});

router.get('state', async (req: Request, res: Response, next: NextFunction) => {
    return res.json(Context.it.lastIOStates.temperatures);
});

router.post('/toggle/:device', async (req: Request, res: Response, next: NextFunction) => {
    const device = req.params.device;
    switch (device) {
        case 'salt':
            await IO.it.toggleSaltState();
            Context.it.logIODevice('salt', Context.it.saltState ? 1 : 0, 'web', req.socket.remoteAddress ?? "???");
            return res.json({ state: Context.it.saltState ? 'An' : 'Aus' });
        case 'pump':
            await IO.it.togglePumpState();
            Context.it.logIODevice('pump', Context.it.pumpState ? 1 : 0, 'web', req.socket.remoteAddress ?? "???");
            return res.json({ state: Context.it.pumpState ? 'An' : 'Aus' });
    }

    res.end();
});

router.post('/rename/:sensor', async (req: Request, res: Response, next: NextFunction) => {
    const sensor = req.params.sensor;
    if (!TemperatureSensorManager.it.sensors.includes(sensor)) {
        return res.status(404).json({ message: `Temperatursensor "${sensor}" existiert nicht.` });
    }

    await Context.it.setTempName(sensor, req.body.name);
    return res.json({ name: Context.it.getTempName(sensor) });
});

router.post('/interval/:value', async (req: Request, res: Response, next: NextFunction) => {
    const newUpdateInterval = parseInt(req.params.value);
    if (isNaN(newUpdateInterval)) {
        res.end;
    } else {
        Context.it.updateInterval = newUpdateInterval;
        return res.json({ interval: Context.it.updateInterval });
    }
});

export { router as temperatureRouter };
