import { Moment } from "moment";
import { IAction } from "../action/iaction";
import { ITrigger } from "./itrigger";
import schedule from 'node-schedule';

export class TimestampTrigger extends ITrigger {
    constructor(public readonly time: Moment, actions: IAction[]) {
        super(actions);
    }

    async register(): Promise<void> {
        schedule.scheduleJob(this.time.toDate(), async () => {
            await this.execute();
        });
    }
}