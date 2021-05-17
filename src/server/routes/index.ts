import { NextFunction, Request, Response, Router } from "express";
import { Context } from "../../lib/system/context";
import { Trigger } from "../../lib/system/trigger";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('index', {
        trigger: Trigger.it.all.map(t => {
            const action = t.trigger.actions[0];
            const condition = action?.conditions[0];

            return {
                enabled: t.trigger.enabled,
                trigger: t.trigger.getDescription(),
                action: (action?.getDescription() ?? '') + ' ' + (condition?.getDescription() ?? ''),
            }
        }),
        state: Context.it.lastIOStates,
    });
});


router.get('/tempLog', (req: Request, res: Response, next: NextFunction) => {
    const timeseriesData = Context.it.temperatures;

    res.json(Object.keys(timeseriesData).map(sensor => {
        return {
            name: timeseriesData[sensor].name,
            data: timeseriesData[sensor].log.map(d => {
                return {
                    x: d.timestamp,
                    y: d.value
                };
            })
        };
    }))
})
export { router as indexRouter };
