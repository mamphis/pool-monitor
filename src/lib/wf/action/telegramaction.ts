import { Action, Condition } from "@nucleus/wf";
import { Telegram } from "../../interfaces/telegram";

export class TelegramAction extends Action.IAction {

    constructor(conditions: Condition.ICondition[]) {
        super(conditions);
    }

    async execute(): Promise<boolean> {
        await Telegram.it.sendStatusToAllUsers();
        return true;
    }

    getDescription(): string {
        return "Sende Telegram Statusmeldung";
    }

    persist(): Partial<TelegramAction> {
        return {
        };
    }
}