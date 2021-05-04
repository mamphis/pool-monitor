import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Display } from "../../lib/display";
import { TemperatureSensorManager } from "../../lib/temperature";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('temperature', { sensors: TemperatureSensorManager.it.sensors });
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const sensor = TemperatureSensorManager.it.sensor[req.params.id];
    let returnObj: { sensors: string[], currentSensor?: { id: string, temperature: number, formatted: string } } = { sensors: TemperatureSensorManager.it.sensors, currentSensor: undefined };
    if (sensor) {
        const temp = await sensor.getTemperature();
        returnObj.currentSensor = { id: req.params.id, temperature: temp, formatted: await sensor.getTemperatureFormatted(temp) };
    }

    Display.it.setText(`${returnObj.currentSensor?.id}\n${returnObj.currentSensor?.formatted}`);
    return res.render('temperature', returnObj);
});

export { router as temperatureRouter };