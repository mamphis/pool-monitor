
import { Telegram } from "../../interfaces/telegram";
import { ICondition } from "../condition/icondition";
import { IAction } from "./iaction";

export class TelegramAction extends IAction {

    constructor(conditions: ICondition[]) {
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