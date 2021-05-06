import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Context } from "../../lib/context";
import { Display } from "../../lib/display";
import { TemperatureSensorManager } from "../../lib/temperature";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('device', { state: Context.it.lastIOStates });
});

router.get('state', async (req: Request, res: Response, next: NextFunction) => {
    return res.json(Context.it.lastIOStates.temperatures);
});

export { router as temperatureRouter };