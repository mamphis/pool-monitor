import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Display } from "../../lib/display";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    Display.it.setText('Hallo Welt')
    return res.render('index');
});


router.post('/setText', (req: Request, res: Response, next: NextFunction) => {
    return res.render('index');
});

export { router as indexRouter };