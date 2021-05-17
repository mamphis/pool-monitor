import moment from "moment";
import schedule, { RecurrenceRule } from 'node-schedule';
import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";
import { ITrigger } from "./itrigger";

export class RecurrentTrigger extends ITrigger {
    public readonly rule: RecurrenceRule;
    constructor([hour, minute]: [number, number], actions: IAction[]) {
        super(actions);
        this.rule = new RecurrenceRule();
        this.rule.hour = hour;
        this.rule.minute = minute;
    }

    async register(name: string): Promise<TriggerJob> {
        const job = schedule.scheduleJob(`trigger${name}`, this.rule, async () => {
            await this.execute();
        });

        return {
            cancel: job ? job.cancel.bind(job) : () => { },
            nextInvocation: () => (this.enabled && job && job.nextInvocation()) ? moment(job.nextInvocation().toISOString()) : undefined
        }
    }

    getDescription(): string {
        return `Täglich um ${this.rule.hour.toString().padStart(2, '0')}:${this.rule.minute.toString().padStart(2, '0')}`;
    }
}