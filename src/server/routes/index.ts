import { NextFunction, Request, Response, Router } from "express";
import { Context, LogEntry } from "../../lib/context";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Display.it.setText('Hallo Welt')

    const timeseriesData = Context.it.log.filter(d => d.device == 'temp').reduce((prev: {
        [name: string]: LogEntry[]
    }, curr) => {
        prev[curr.deviceName] = prev[curr.deviceName] || [];
        prev[curr.deviceName].push(curr);
        return prev;
    }, {});



    return res.render('index', {
        temperatures: Object.keys(timeseriesData).map(name => {
            return {
                name,
                data: timeseriesData[name].map(d => {
                    return {
                        x: d.timestamp,
                        y: d.value
                    };
                })
            };
        })
    });
});

export { router as indexRouter };