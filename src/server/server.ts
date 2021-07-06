import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response, static as staticImport, urlencoded } from "express";
import createHttpError, { HttpError } from 'http-errors';
import moment from 'moment';
import { randomString } from '../lib/utils';
import { auth } from './middleware/auth';
import { indexRouter } from "./routes";
import { temperatureRouter } from "./routes/device";
import { loginRouter } from './routes/login';
import { registerRouter } from './routes/register';
import { systemRouter } from './routes/system';
import { triggerRouter } from "./routes/trigger";
import { Server as WebSocketServer } from 'ws';
import { createServer } from 'http';
import { exec } from 'child_process';
import { stderr } from 'node:process';

export class Server {
    private app: Application;
    private wss: WebSocketServer;
    constructor(private port: number) {
        this.app = express();
        this.wss = new WebSocketServer({ port: 3001 });
    }

    async config() {
        this.app.use(cookieParser(randomString(10)));
        this.app.use(express.json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(cors());

        this.app.use('/static', staticImport('./static'));
        this.app.use('/static/js', staticImport('./node_modules/jquery/dist'));
        this.app.use('/static/js', staticImport('./node_modules/apexcharts/dist'));
        this.app.use('/static/css', staticImport('./node_modules/apexcharts/dist'));
        this.app.use('/static/css', staticImport('./node_modules/@fortawesome/fontawesome-free/css'));
        this.app.use('/static/webfonts', staticImport('./node_modules/@fortawesome/fontawesome-free/webfonts'));
        this.app.use('/static/css', staticImport('./node_modules/bulma/css'));
        this.app.use('/static/js', staticImport('./node_modules/xterm/lib'));
        this.app.use('/static/css', staticImport('./node_modules/xterm/css'));
        this.app.set('view engine', 'ejs');

        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            const start = moment();
            await next();
            const end = moment();

            console.log(`(${end.diff(start)}ms) [${req.method}] ${req.originalUrl} => ${res.statusCode} ${res.statusMessage} ${req.method === 'POST' ? JSON.stringify(req.body) : ''}`);
        });

        this.app.use('/login', loginRouter);
        this.app.use('/register', registerRouter);
        this.app.use('/', indexRouter);
        this.app.use('/device', temperatureRouter);
        this.app.use('/trigger', triggerRouter);
        this.app.use('/system', auth, systemRouter);

        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            next(createHttpError(404))
        });

        this.app.use(async (error: Error | HttpError, req: Request, res: Response, next: NextFunction) => {
            if (error instanceof HttpError) {
                switch (error.status) {
                    case 401:
                        return res.redirect('/login');

                    default:
                        return res.render('error', { code: error.status, message: error.message });

                }
            } else {
                res.render('error', { code: 500, message: error.message });
            }
        });

        this.wss.on('connection', (socket, req) => {
            console.log("Someone connected.");
            socket.on('message', (data) => {
                console.log(data);
                try {
                    exec(data as string, (err, stdout, stderr) => {
                        socket.send(JSON.stringify({ stdout, stderr }));
                    });
                }
                catch (e) {
                    socket.send(JSON.stringify({ stderr: `${e.name}: ${e.message}` }));
                }
            });
        });
    }

    async start() {
        this.app.listen(this.port, () => {
            console.log(`Server started listening on port: ${this.port}`);
        });
    }
}


