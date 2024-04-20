import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from 'jsonwebtoken';
import { userCount } from "../../lib/system/user";
import { randomString } from "../../lib/utils";

const secret = randomString(20);

export type payload = { username: string };

export const getToken = (payload: payload): string => {
    return jwt.sign({ user: payload }, secret);
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    if (userCount() === 0) {
        return res.redirect('/register');
    }

    if (!req.signedCookies.user) {
        next(createHttpError(401));
    } else {
        try {
            const { user } = jwt.verify(req.signedCookies.user, secret) as { user: payload };
            res.locals.user = user;
            next();
        } catch {
            next(createHttpError(401));
        }
    }
}