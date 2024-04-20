import { compare } from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import createHttpError from "http-errors";
import { Context } from "../../lib/system/context";
import { getToken, isAuthed } from "../middleware/auth";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if (isAuthed(req)) {
        return res.redirect('/');
    }

    return res.render('login', {});
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const users = Context.it.users;
    console.log(users);
    if (users[req.body.username]) {
        if (await compare(req.body.password, users[req.body.username])) {
            res.cookie('user', getToken(req.body), { signed: true });
            return res.redirect((req.query.returnTo as string | undefined) ?? '/');
        }
    }

    next(createHttpError(401));
});

export { router as loginRouter };

