import express, { Application, json, NextFunction, Request, Response, static as staticImport } from "express";
import cors from 'cors';
import moment from 'moment';
import { indexRouter } from "./routes";

export class Server {
    private app: Application;

    constructor(private port: number) {
        this.app = express();
    }

    async config() {
        this.app.use(json({ limit: '5mb' }));
        this.app.use(cors());

        this.app.use('/static', staticImport('./static'));
        this.app.set('view engine', 'ejs');

        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            const start = moment();
            await next();
            const end = moment();

            console.log(`(${end.diff(start)}ms) [${req.method}] ${req.originalUrl} => ${res.statusCode} ${res.statusMessage} ${req.method === 'POST' ? JSON.stringify(req.body) : ''}`);
        });

        this.app.use('/', indexRouter);
    }

    async start() {
        this.app.listen(this.port, () => {
            console.log(`Server started listening on port: ${this.port}`);
        });
    }
}


