import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
    return res.render('index');
});

export { router as indexRouter };