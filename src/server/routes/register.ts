import { hash } from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import { Context } from "../../lib/system/context";
import { userCount } from "../../lib/system/user";

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.render('register', {});
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    if (userCount() == 0) {
        Context.it.setUser(req.body.username, await hash(req.body.password, 10));
    }

    return res.redirect('/login');
});

export { router as registerRouter };
