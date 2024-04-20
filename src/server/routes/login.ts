import { NextFunction, Request, Response, Router } from "express";
import createHttpError from "http-errors";
import { getToken, isAuthed, login } from "../middleware/auth";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if (isAuthed(req)) {
        return res.redirect('/');
    }

    return res.render('login', {});
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    if (await login(req.body.username, req.body.password)) {
        res.cookie('user', getToken(req.body), { signed: true });
        return res.redirect((req.query.returnTo as string | undefined) ?? '/');
    }

    next(createHttpError(401));
});

export { router as loginRouter };

