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
    const { filter, pump } = req.params;
    if (filter) {
        await IO.it.toggleFilterState();
        return res.json({ state: Context.it.filterState ? 'An' : 'Aus' });
    }
    if (pump) {
        await IO.it.togglePumpState();
        return res.json({ state: Context.it.pumpState ? 'An' : 'Aus' });
    }
});

export { router as temperatureRouter };