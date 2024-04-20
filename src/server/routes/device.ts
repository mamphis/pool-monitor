import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Context } from "../../lib/context";
import { Display } from "../../lib/display";
import { IO } from "../../lib/io";
import { TemperatureSensorManager } from "../../lib/temperature";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('device', { state: Context.it.lastIOStates });
});

router.get('state', async (req: Request, res: Response, next: NextFunction) => {
    return res.json(Context.it.lastIOStates.temperatures);
});

router.post('/toggle/:device', async (req: Request, res: Response, next: NextFunction) => {
    const device = req.params.device;
    switch (device) {
        case 'filter':
            await IO.it.toggleFilterState();
            return res.json({ state: Context.it.filterState ? 'An' : 'Aus' });
        case 'pump':
            await IO.it.togglePumpState();
            return res.json({ state: Context.it.pumpState ? 'An' : 'Aus' });
    }

    res.end();
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