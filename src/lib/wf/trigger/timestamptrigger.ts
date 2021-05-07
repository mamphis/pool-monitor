import { Moment } from "moment";
import { IAction } from "../action/iaction";
import { ITrigger } from "./itrigger";
import schedule from 'node-schedule';
import { TriggerJob } from "../triggerjob";
import moment from "moment";

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
            cancel: job.cancel,
            nextInvocation: () => (job && job.nextInvocation()) ? moment(job.nextInvocation().toISOString()) : undefined
        }
    }

    getDescription(): string {
        return `Am ${this.time.format('DD.MM.YYYY HH:mm')}`;
    }
}