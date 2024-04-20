import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('trigger', { message: "Set Default Text" });
});

export {router as triggerRouter};