import { IAction } from "../action/iaction";
import { ITrigger } from "./itrigger";
import schedule, { RecurrenceRule } from 'node-schedule';

export class RecurrentTrigger extends ITrigger {
    public readonly rule: RecurrenceRule;
    constructor([hour, minute]: [number, number], actions: IAction[]) {
        super(actions);
        this.rule = new RecurrenceRule();
        this.rule.hour = hour;
        this.rule.minute = minute;
    }

    async register(): Promise<void> {
        const job = schedule.scheduleJob(this.rule, async () => {
            await this.execute();
        });
    }

    getDescription(): string {
        return `Täglich um ${this.rule.hour.toString().padStart(2, '0')}:${this.rule.minute.toString().padStart(2, '0')}`;
    }
}