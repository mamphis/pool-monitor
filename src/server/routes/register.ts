import { NextFunction, Request, Response, Router } from "express";
import { Context } from "../../lib/system/context";
import { userCount } from "../../lib/system/user";
import { hash } from "../../lib/utils";
import { isAuthed } from "../middleware/auth";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if (userCount() > 0 || isAuthed(req)) {
        return res.redirect('/');
    }
    
    return res.render('register', {});
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    if (userCount() == 0) {
        Context.it.setUser(req.body.username, hash(req.body.password));
    }

    return res.redirect('/login');
});

export { router as registerRouter };

