import moment from 'moment';
import TelegramBot, { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { Context } from '../system/context';
import { Trigger } from '../system/trigger';

const keyboards: { [key: string]: InlineKeyboardMarkup } = {
    default: {
        inline_keyboard: [
            [
                { text: 'Status', callback_data: 'cmd-get-status' },
            ]
        ]
    },
    status: {
        inline_keyboard: [
            [
                { text: 'Status', callback_data: 'cmd-get-status' },
            ], [
                { text: 'Salzanlage umschalten', callback_data: 'cmd-toggle-salt' },
                { text: 'Pumpe umschalten', callback_data: 'cmd-toggle-pump' }
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

        this.api.onText(/\/start(.*)/, (msg, match) => {
            console.log(msg);
            const startToken = (match && match[1].trim()) ?? '';
            console.log(match, match?.[1]);
            if (startToken === '') {
                return;
            }

            const users = Object.keys(Context.it.users);
            const username = users.find(u => Context.it.users[u].telegramToken === startToken);

            if (!username) {
                return;
            }

            Context.it.updateUser(username, { telegramId: msg.from?.id });

            const user = Context.it.users[username];

            this.api.sendMessage(user.telegramId, 'Herzlich willkommen zum Advanced Pool Monitor Bot.', {
                reply_markup: keyboards.default
            });
        });

        this.api.onText(/\/status/, async (msg, match) => {
            this.api.sendMessage(msg.from?.id ?? 0, await this.getPoolStatusText(), {
                reply_markup: keyboards.status,
                parse_mode: 'MarkdownV2'
            });
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

            if (data === 'cmd-get-status') {
                const messageId = query.message?.message_id;
                const chatId = query.from.id;

                if (messageId) {
                    this.api.editMessageText(await this.getPoolStatusText(),
                        {
                            chat_id: chatId,
                            message_id: messageId,
                            parse_mode: 'MarkdownV2',
                            reply_markup: keyboards.status
                        });
                } else {
                    this.api.sendMessage(query.from.id, await this.getPoolStatusText(), {
                        reply_markup: keyboards.status,
                        parse_mode: 'MarkdownV2'
                    });
                }

                this.api.answerCallbackQuery(query.id);
            }
        });
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

Aktuell ist die 💧 Pumpe ${Context.it.lastIOStates.pump ? 'an' : 'aus'}
Aktuell ist die 🧂 Salzanlage ${Context.it.lastIOStates.salt ? 'an' : 'aus'}


Gespeicherte Trigger:
${Trigger.it.all.map(t => {
            return `**${t.name}**
    aktiv: ${t.trigger.enabled ? '✔' : '❌'}
    nächste Ausführung: ${t.job.nextInvocation()?.format('DD.MM.YYYY HH:mm') ?? '---'}
`
        }).join('\n')}
`.replace(/[\.\(\)\-]/g, (val) => `\\${val}`);;

        console.log(text);
        return text;
    }

    private checkUser(id: number): boolean {
        const users = Object.keys(Context.it.users);
        const username = users.find(u => Context.it.users[u].telegramId === id);

        return username !== undefined;
    }

    async getTelegramLink(username: string) {
        const meBot = await this.api.getMe()
        const url = `https://t.me/${meBot.username}?start=${Context.it.users[username].telegramToken}`;

        return url;
    }


}