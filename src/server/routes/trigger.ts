import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('trigger', { trigger: [] });
});

router.get('/new', (req: Request, res: Response, next: NextFunction) => {
    return res.render('newtrigger', {  });
});

export {router as triggerRouter};