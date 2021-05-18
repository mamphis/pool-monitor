import moment from "moment";
import schedule, { RecurrenceRule } from 'node-schedule';
import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";
import { ITrigger } from "./itrigger";

export class RecurrentTrigger extends ITrigger {
    public readonly rule: RecurrenceRule;
    constructor([hour, minute, dayOfWeek]: [number, number, number[]], actions: IAction[]) {
        super(actions);
        this.rule = new RecurrenceRule();
        this.rule.hour = hour;
        this.rule.minute = minute;
        this.rule.dayOfWeek = dayOfWeek;
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
        let when = 'Täglich';
        const days = this.rule.dayOfWeek as number[];
        if (days.length !== 7) {
            // Some Days are missing. List all days
            const dayMap: { [day: number]: string } = {
                0: 'sonntags',
                1: 'montags',
                2: 'dienstags',
                3: 'mittwochs',
                4: 'donnerstags',
                5: 'freitags',
                6: 'samstags',
            }

            when = days.map(d => dayMap[d]).join(', ');
            when = when[0].toUpperCase() + when.substr(1);
        }

        return `${when} um ${this.rule.hour.toString().padStart(2, '0')}:${this.rule.minute.toString().padStart(2, '0')}`;
    }
}