import { NextFunction, Request, Response, Router } from "express";
import moment from "moment";
import { Display } from "../../lib/display";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    Display.it.setText('Hallo Welt')
    return res.render('index',{message: "Set Default Text"});
});

router.get('/kill', (req: Request, res: Response, next: NextFunction) => {
    Display.it.killDisplay();
    return res.render('index', {message: "Display killed."});
});

router.post('/setText', (req: Request, res: Response, next: NextFunction) => {
    return res.render('index',{message: "Set Text: "});
});

export { router as indexRouter };