import { NextFunction, Request, Response, Router } from "express";
import { Trigger } from "../../lib/system/trigger";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('trigger', {
        trigger: Trigger.it.all.map(t => {
            const action = t.trigger.actions[0];
            const condition = action?.conditions[0];
            
            const invocation = t.job.nextInvocation()?.format('DD.MM.YYYY HH:mm') ?? '---';
            return {
                trigger: t.trigger.getDescription(),
                action: (action?.getDescription() ?? '') + ' ' + (condition?.getDescription() ?? ''),
                nextInvocation: invocation
            }
        }),
    });
});

router.delete('/:index', (req: Request, res: Response, next: NextFunction) => {
    const index = parseInt(req.params.index);

    if (isNaN(index)) {
        return res.status(400).json({ error: 'Index is not a number.' });
    }

    const t = Trigger.it.all[index];
    Trigger.it.delete(t.name);

    return res.json({});
});

router.get('/new', (req: Request, res: Response, next: NextFunction) => {
    return res.render('newtrigger', {});
});

router.post('/new', async (req: Request, res: Response, next: NextFunction) => {
    if (await Trigger.it.add(Math.floor(Math.random() * 1000000).toString(), JSON.stringify(req.body))) {
        return res.json({});
    }

    return res.status(400).json({ error: "Trigger kann nicht hinzugefügt werden." });
});

export { router as triggerRouter };
