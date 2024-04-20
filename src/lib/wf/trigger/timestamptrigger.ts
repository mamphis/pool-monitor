import moment, { Moment } from "moment";
import schedule from 'node-schedule';
import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";
import { ITrigger } from "./itrigger";

export class TimestampTrigger extends ITrigger {
    constructor(public readonly time: Moment, actions: IAction[]) {
        super(actions);
        if (!time.isValid()) {
            throw new Error("The provided time is invalid.");
        }
    }

    async register(name: string): Promise<TriggerJob> {
        const job = schedule.scheduleJob(`trigger${name}`, this.time.toDate(), async () => {
            await this.execute();
        });

        return {
            cancel: job ? job.cancel.bind(job) : () => { },
            nextInvocation: () => (this.enabled && job && job.nextInvocation()) ? moment(job.nextInvocation().toISOString()) : undefined
        }
    }

    getDescription(): string {
        return `Am ${this.time.format('DD.MM.YYYY HH:mm')}`;
    }
}