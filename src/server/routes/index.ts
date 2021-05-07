import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Display.it.setText('Hallo Welt')
    return res.render('index', { message: "Set Default Text" });
});

router.post('/setText', (req: Request, res: Response, next: NextFunction) => {
    const { customText } = req.body;
    // Display.it.setText(customText);
    return res.render('index', { message: `Set Text: "${customText}"` });
});

export { router as indexRouter };