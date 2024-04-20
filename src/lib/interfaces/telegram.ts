import moment from 'moment';
import TelegramBot, { CallbackQuery, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { IO } from '../peripherals/io';
import { Context } from '../system/context';
import { Trigger } from '../system/trigger';
import localtunnel from 'localtunnel';

const keyboards: { [key: string]: InlineKeyboardMarkup } = {
    default: {
        inline_keyboard: [
            [
                { text: 'Status', callback_data: 'cmd-get-new-status' },
            ]
        ]
    },
    status: {
        inline_keyboard: [
            [
                { text: 'Status', callback_data: 'cmd-get-status' },
            ], [
                { text: 'Pumpe umschalten', callback_data: 'cmd-toggle-pump' },
                { text: 'Salzanlage umschalten', callback_data: 'cmd-toggle-salt' },
            ]
        ]
    }
}


export class Telegram {
    private static instance?: Telegram;

    static get it(): Telegram {
        if (!this.instance) {
            this.instance = new Telegram();
        }

        return this.instance;
    }

    private api: TelegramBot;

    private constructor() {
        this.api = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN ?? '', {
            polling: true
        });

        Context.it.on('stateToggled', (which, state, source) => {
            const users = Object.keys(Context.it.users);
            users.forEach(username => {
                const user = Context.it.users[username];
                if (user.telegram.id !== 0 && user.telegram.notificationEnabled) {
                    this.api.sendMessage(user.telegram.id, `
Hallo ${user.name}!
Gerade wurde das Gerät ${this.getDevice(which)} von ${source} umgeschaltet. Der neue Status ist ${state ? 'an ✅' : 'aus ❌'}.`, {
                        reply_markup: keyboards.default,
                        disable_notification: user.telegram.notificationMuted,
                    });
                }
            });
        });

        this.api.onText(/\/start(.*)/, (msg, match) => {
            const startToken = (match && match[1].trim()) ?? '';
            if (startToken === '') {
                return;
            }

            const users = Object.keys(Context.it.users);
            const username = users.find(u => Context.it.users[u].telegram.token === startToken);

            if (!username) {
                return;
            }

            Context.it.updateUser(username, { id: msg.from?.id, username: msg.from?.username ? msg.from?.username ?? '' : msg.from?.first_name ?? '' });

            const user = Context.it.users[username];

            this.api.sendMessage(user.telegram.id, 'Herzlich willkommen zum Advanced Pool Monitor Bot.', {
                reply_markup: keyboards.default
            });
        });

        this.api.onText(/\/status/, async (msg, match) => {
            this.api.sendMessage(msg.from?.id ?? 0, await this.getPoolStatusText(), {
                reply_markup: keyboards.status,
                parse_mode: 'MarkdownV2'
            });
        });

        this.api.onText(/\/service/, async (msg, match) => {
            const user = Object.values(Context.it.users).find(u => u.telegram.id === msg.from?.id);
            if (user) {
                const tunnel = await localtunnel(3000);
                
                this.api.sendMessage(msg.from?.id ?? 0, tunnel.url);
            }
        });

        this.api.on('callback_query', async (query) => {
            if (!this.checkUser(query.from.id)) {
                return;
            }

            const { data } = query;
            if (!data) {
                this.api.answerCallbackQuery(query.id);
                return;
            }

            if (data === 'cmd-get-new-status') {
                this.api.sendMessage(query.from.id, await this.getPoolStatusText(), {
                    reply_markup: keyboards.status,
                    parse_mode: 'MarkdownV2'
                });
            }

            if (data === 'cmd-get-status') {
                this.updateStatus(query);
            }

            if (data === 'cmd-toggle-salt') {
                await IO.it.toggleSaltState();
                Context.it.logIODevice('salt', Context.it.saltState ? 1 : 0, 'telegram', query.from.username ? `@${query.from.username}` : query.from.first_name);

                this.updateStatus(query);
            }

            if (data === 'cmd-toggle-pump') {
                await IO.it.togglePumpState();
                Context.it.logIODevice('pump', Context.it.pumpState ? 1 : 0, 'telegram', query.from.username ? `@${query.from.username}` : query.from.first_name);

                this.updateStatus(query);
            }

            this.api.answerCallbackQuery(query.id);
        });
    }

    private async updateStatus(query: CallbackQuery) {
        const messageId = query.message?.message_id;
        const chatId = query.from.id;

        if (messageId) {
            this.api.editMessageText(await this.getPoolStatusText(),
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'MarkdownV2',
                    reply_markup: keyboards.status
                }).catch(e => { });
        } else {
            this.api.sendMessage(query.from.id, await this.getPoolStatusText(), {
                reply_markup: keyboards.status,
                parse_mode: 'MarkdownV2'
            });
        }
    }

    getDevice(which: string) {
        switch (which) {
            case 'salt':
                return '🧂 Salzanlage';
            case 'pump':
                return '💧 Pumpe';
            default:
                return which;
        }
    }

    private async getPoolStatusText(): Promise<string> {
        const text = `Der aktuelle Pool Status (${moment().format('DD.MM.YYYY HH:mm')}):
Installierte Version: ${Context.it.installedVersion}
Aktuellste Version: ${Context.it.versionInfo.latestVersion}
Überprüft am: ${Context.it.versionInfo.lastChecked.format('DD.MM.YYYY HH:mm')}

Die Aktuellen Temperaturen betragen:
${Context.it.lastIOStates.temperatures.map(ts => {
            return `🌡 ${ts.name}: ${ts.temperature}°C`;
        }).join('\n')}
Aktuell ist die 💧 Pumpe ${Context.it.lastIOStates.pump ? 'an ✅' : 'aus ❌'}
Aktuell ist die 🧂 Salzanlage ${Context.it.lastIOStates.salt ? 'an ✅' : 'aus ❌'}

Gespeicherte Trigger:
${Trigger.it.all.map(t => {
            return `__${t.name}__: ${t.trigger.getDescription()}
${t.trigger.actions.map(a => a.getDescription()).join()}
    aktiv: ${t.trigger.enabled ? '✅' : '❌'}
    nächste Ausführung: ${t.job.nextInvocation()?.format('DD.MM.YYYY HH:mm') ?? '---'}
`
        }).join('\n')}
`.replace(/[\.\(\)\-]/g, (val) => `\\${val}`);;

        return text;
    }

    private checkUser(id: number): boolean {
        const users = Object.keys(Context.it.users);
        const username = users.find(u => Context.it.users[u].telegram.id === id);

        return username !== undefined;
    }

    async getTelegramLink(username: string) {
        const meBot = await this.api.getMe()
        const url = `https://t.me/${meBot.username}?start=${Context.it.users[username].telegram.token}`;

        return url;
    }

    async sendStatusToAllUsers() {
        for (const username in Context.it.users) {
            const user = Context.it.users[username];
            if (user.telegram.id !== 0 && user.telegram.notificationEnabled) {
                this.api.sendMessage(user.telegram.id, await this.getPoolStatusText(), {
                    parse_mode: 'MarkdownV2',
                    disable_notification: user.telegram.notificationMuted,
                });
            }
        }
    }
}