import moment, { Moment } from "moment";
import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";
import { ITrigger } from "./itrigger";

export class IntervalTrigger extends ITrigger {
    constructor(public readonly interval: number, actions: IAction[]) {
        super(actions);
    }

    private lastInvocation?: Moment;

    async register(name: string): Promise<TriggerJob> {
        this.lastInvocation = moment();
        const interval = setInterval(async () => {
            this.lastInvocation = moment();
            await this.execute();

        }, this.interval);

        return {
            cancel: () => clearInterval(interval),
            nextInvocation: () => this.lastInvocation?.clone()?.add(this.interval, 'milliseconds')
        };
    }

    getDescription(): string {
        return `Alle ${(this.interval / 1000).toFixed(1)} Sekunden`;
    }
}