import { NextFunction, Request, Response, Router } from "express";
import { PersistanceManager } from "../../lib/wf/persistancemanager";

const router = Router();
const triggers: string[] = [];

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('trigger', {
        trigger: triggers.map(t => {
            const trigger = PersistanceManager.fromString(t);
            const action = trigger.actions[0];
            const condition = action?.conditions[0];
            return {
                trigger: trigger.getDescription(),
                action: (action?.getDescription() ?? '') + ' ' + (condition?.getDescription() ?? ''),
            }
        }),
    });
});

router.get('/new', (req: Request, res: Response, next: NextFunction) => {
    return res.render('newtrigger', {});
});

router.post('/new', (req: Request, res: Response, next: NextFunction) => {
    try {
        const trigger = JSON.stringify(req.body);
        // Check if trigger can be parsed.
        PersistanceManager.fromString(trigger);
        triggers.push(trigger);

        return res.json({});
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

export { router as triggerRouter };