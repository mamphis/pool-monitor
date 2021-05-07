import { NextFunction, Request, Response, Router } from "express";
import { Context, LogEntry } from "../../lib/context";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('index', {
    });
});


router.get('/tempLog', (req: Request, res: Response, next: NextFunction) => {
    const timeseriesData = Context.it.temperatures;

    res.json(Object.keys(timeseriesData).map(name => {
        return {
            name,
            data: timeseriesData[name].map(d => {
                return {
                    x: d.timestamp,
                    y: d.value
                };
            })
        };
    }))
})
export { router as indexRouter };