import { compare } from "bcrypt";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from 'jsonwebtoken';
import { Context } from "../../lib/system/context";
import { userCount } from "../../lib/system/user";
import { randomString } from "../../lib/utils";

const secret = randomString(20);

export type payload = { username: string, password: string };

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

export const isAuthed = (req: Request): boolean => {
    try {
        jwt.verify(req.signedCookies.user, secret) as { user: payload };
        return true
    } catch {
        return false;
    }
}
export async function login(username: string, password: string): Promise<boolean>;
export async function login(cookie: string): Promise<boolean>;
export async function login(usernameOrCookie: string, password?: string): Promise<boolean> {
    let username, pwd: string;
    if (!password) {
        try {
            const { user } = jwt.verify(usernameOrCookie, secret) as { user: payload };
            username = user.username;
            pwd = user.password;
        } catch {
            return false;
        }
    } else {
        username = usernameOrCookie;
        pwd = password;
    }

    const users = Context.it.users;

    if (users[username]) {
        if (await compare(pwd, users[username])) {
            return true;
        }
    }

    return false;
}