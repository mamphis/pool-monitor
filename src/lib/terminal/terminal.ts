import { exec } from "child_process";
import cookieParser from "cookie-parser";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import { login } from "../../server/middleware/auth";
import figlet from "figlet";
import { Context } from "../system/context";
import { Trigger } from "../system/trigger";

export class Terminal {
    private terminalSettings?: { dim: { rows: number; cols: number; }; };

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
        const loggedIn = await login(success);
        if (!loggedIn.success) {
            socket.close(3003, 'Credentials not valid 🔐');
            console.warn('The socket cookie can not login due invalid credentials. 🔐');
            return;
        }

        return new Terminal(socket, loggedIn.username);
    }

    private constructor(private socket: WebSocket, private user: string) {
        console.log("Someone connected.");
        this.socket.on('message', this.messageHandler.bind(this));

        this.socket.send(JSON.stringify({
            type: 'system-command',
            message: 'doInit'
        }));
    }

    private getInfoText(): string {
        if (!this.terminalSettings) {
            return '';
        }

        return `
${figlet.textSync('PoolTerm', { width: this.terminalSettings.dim.cols })}

${this.centerText('Das Terminal für den Pool', this.terminalSettings.dim.cols)}

Herzlich willkommen ${this.user}
`;
    }

    private centerText(message: string, cols: number): string {
        return message.padStart((cols - message.length) / 2 + message.length, ' ');
    }

    private getHelpText(): string {
        return `
Folgende Befehle werden unterstützt:
${[
                { command: 'help', helpText: 'Zeigt diese Hilfe an.' },
                { command: 'close', helpText: 'Beendet die Verbindung zum Server.' },
                { command: 'status', helpText: 'Zeigt Statusdaten zum Poolmonitor.' },
            ].map(cmd => {
                return `\u001b[34m!${cmd.command}\u001b[0m\t${cmd.helpText}`
            }).join('\n')
            }
`;
    }

    private async getPoolStatusText() {
        return `
Der PoolMonitor hat den Status 'healthy'
Installierte Version: ${Context.it.installedVersion}
Aktuellste Version:   ${Context.it.versionInfo.latestVersion}
Überprüft am:         ${Context.it.versionInfo.lastChecked.format('DD.MM.YYYY HH:mm')}

Angeschlossende Geräte:
Salzanlage 🧂:        ${Context.it.saltState ? '✔' : '❌'}
Pumpe 💧:             ${Context.it.pumpState ? '✔' : '❌'}

Angeschlossende Sensoren:
${Context.it.lastIOStates.temperatures.map(ts => {
            return `${ts.name.padEnd(21, ' ')}${ts.temperature}°C`;
        }).join('\n')}

Gespeicherte Trigger:
${Trigger.it.all.map(t => {
            return `\u001b[34m${t.name}\u001b[0m
    aktiv: ${t.trigger.enabled ? '✔' : '❌'}
    nächste Ausführung: ${t.job.nextInvocation()?.format('DD.MM.YYYY HH:mm') ?? '---'}
`
        }).join('\n')}
`


    }

    private sendReadyInfo() {
        this.socket.send(JSON.stringify({
            type: 'system-command',
            message: 'disableStdin'
        }));

        this.socket.send(JSON.stringify({
            type: 'system-info',
            message: this.getInfoText()
        }));

        this.socket.send(JSON.stringify({
            type: 'system-command',
            message: 'prompt'
        }));
    }

    private async messageHandler(data: WebSocket.Data) {
        console.log(data, typeof data)

        if (typeof data !== 'string') {
            data = data.toString('utf8');
            // this.socket.send(JSON.stringify({
            //     type: 'system-err',
            //     message: `The data format is not valid. Allowed is: 'string'.`
            // }));
            // return;
        }

        const { type, message } = JSON.parse(data) as { type: string, message: string };
        console.log(type, message);
        if (type === 'command') {
            if (message.startsWith('!')) {
                if (message.startsWith('!help')) {
                    this.socket.send(JSON.stringify({
                        type: 'system-info',
                        message: this.getHelpText()
                    }));

                    this.socket.send(JSON.stringify({
                        type: 'system-command',
                        message: 'prompt'
                    }));
                } else if (message.startsWith('!close')) {
                    this.socket.close(3004, 'The socket was closed to fullfill the client request 🤷‍♂️');
                } else if (message.startsWith('!status')) {
                    this.socket.send(JSON.stringify({
                        type: 'system-info',
                        message: await this.getPoolStatusText()
                    }));

                    this.socket.send(JSON.stringify({
                        type: 'system-command',
                        message: 'prompt'
                    }));
                } else {
                    this.socket.send(JSON.stringify({
                        type: 'system-warn',
                        message: `Unbekannter Befehl '${message}'`
                    }));

                    this.socket.send(JSON.stringify({
                        type: 'system-command',
                        message: 'prompt'
                    }));
                }
            } else {
                try {
                    const childProcess = exec(message);
                    childProcess.stdout?.on('data', (data) => {
                        this.socket.send(JSON.stringify({ type: 'exec-stdout', message: data }));
                    });

                    childProcess.stderr?.on('data', (data) => {
                        this.socket.send(JSON.stringify({ type: 'exec-stderr', message: data }));
                    });

                    childProcess.on('close', (code) => {
                        this.socket.send(JSON.stringify({ type: 'exec-stdout', message: `Process exited with code ${code}` }));
                        this.socket.send(JSON.stringify({ type: 'system-command', message: 'prompt' }));
                    });
                    // exec(message, (err, stdout, stderr) => {
                    //     if (stdout) {
                    //         this.socket.send(JSON.stringify({ type: 'exec-stdout', message: stdout }));

                    //         if (err) {
                    //             this.socket.send(JSON.stringify({ type: 'exec-stderr', message: `${err.name}: ${err.message}` }));
                    //         }
                    //     }
                    //     if (stderr) {
                    //         this.socket.send(JSON.stringify({ type: 'exec-stderr', message: stderr }));
                    //     }

                    //     this.socket.send(JSON.stringify({
                    //         type: 'system-command',
                    //         message: 'prompt'
                    //     }));
                    // });
                }
                catch (e: any) {
                    this.socket.send(JSON.stringify({ type: 'exec-stderr', message: `${e.name}: ${e.message}` }));
                    this.socket.send(JSON.stringify({
                        type: 'system-command',
                        message: 'prompt'
                    }));
                }
            }
        } else if (type == 'terminal-ready') {
            const { rows, cols } = JSON.parse(message);
            console.log(message, rows, cols);
            this.terminalSettings = {
                dim: { rows, cols }
            }

            this.sendReadyInfo();
        }
    }
}