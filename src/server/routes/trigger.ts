import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { scheduledJobs } from "node-schedule";
import { PersistanceManager } from "../../lib/wf/persistancemanager";

const router = Router();
const triggers: Array<{ name: string, triggerDef: string }> = [];

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('trigger', {
        trigger: triggers.map(t => {
            const trigger = PersistanceManager.fromString(t.triggerDef);
            const action = trigger.actions[0];
            const condition = action?.conditions[0];
            const job = scheduledJobs['trigger' + t.name];
            const invocation = job ? moment(job.nextInvocation()).format('DD.MM.YYYY HH:mm') : '---';
            return {
                trigger: trigger.getDescription(),
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

    const t = triggers[index];
    scheduledJobs['trigger' + t.name].cancel();

    delete triggers[index];

    return res.json({});
});

router.get('/new', (req: Request, res: Response, next: NextFunction) => {
    return res.render('newtrigger', {});
});

router.post('/new', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trigger = JSON.stringify(req.body);
        // Check if trigger can be parsed.
        const t = PersistanceManager.fromString(trigger);
        const name = Math.floor(Math.random() * 1000000).toString();
        triggers.push({ name: name, triggerDef: trigger });
        await t.register(name);
        return res.json({});
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

export { router as triggerRouter };