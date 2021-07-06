import { exec } from "child_process";
import cookieParser from "cookie-parser";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import { login } from "../../server/middleware/auth";

export class Terminal {
    public static async startSession(socket: WebSocket, req: IncomingMessage, secret: string): Promise<Terminal | undefined> {
        const { cookie } = req.headers;
        if (!cookie) {
            socket.close(3001, 'No cookie 🍪');
            console.warn(`The socket request has no cookie. 🍪`);
            return;
        }

        const cookies = cookie.split(';').map(c => c.trim()).reduce((prev, curr) => {
            const [key, value] = curr.split('=');
            prev[key] = decodeURIComponent(value);
            return prev;
        }, {} as { [key: string]: string });

        const success = cookieParser.signedCookie(cookies.user, secret);
        if (!success) {
            socket.close(3002, 'Cookie not valid ❌');
            console.warn('The socket cookie was not valid. ❌');
            return;
        }

        if (!await login(success)) {
            socket.close(3003, 'Credentials not valid 🔐');
            console.warn('The socket cookie can not login due invalid credentials. 🔐');
            return;
        }

        return new Terminal(socket);
    }

    private constructor(private socket: WebSocket) {
        console.log("Someone connected.");
        this.socket.on('message', this.messageHandler.bind(this));
        this.socket.send(JSON.stringify({
            type: 'system-info',
            message: this.getInfoText()
        }));
    }

    private getInfoText(): string {
        return `Willkommen zum PoolTerminal.`;
    }

    private messageHandler(data: WebSocket.Data) {
        if (typeof data !== 'string') {
            this.socket.send(JSON.stringify({
                type: 'system-err',
                message: `The data format is not valid. Allowed is: 'string'.`
            }));
            return;
        }

        const command = JSON.parse(data) as { type: string, message: string };

        if (command.type === 'command') {
            if (command.message.startsWith('!')) {
                if (command.message.startsWith('!help')) {
                    this.socket.send(JSON.stringify({
                        type: 'system-info',
                        message: this.getInfoText()
                    }));
                } else if (command.message.startsWith('!close')) {
                    this.socket.close(3004, 'The socket was closed to fullfill the client request 🤷‍♂️.');
                }
            } else {
                try {
                    exec(command.message, (err, stdout, stderr) => {
                        if (stdout) {
                            this.socket.send(JSON.stringify({ type: 'exec-stdout', message: stdout }));
                        }
                        if (stderr) {
                            this.socket.send(JSON.stringify({ type: 'exec-stderr', message: stderr }));
                        }
                        if (err) {
                            this.socket.send(JSON.stringify({ type: 'exec-stderr', message: `${err.name}: ${err.message}` }));
                        }
                    });
                }
                catch (e) {
                    this.socket.send(JSON.stringify({ type: 'exec-stderr', message: `${e.name}: ${e.message}` }));
                }
            }
        }
    }
}