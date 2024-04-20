import { IAction } from "../action/iaction";
import { ITrigger } from "./itrigger";

export class IntervalTrigger extends ITrigger {
    constructor(public readonly interval: number, actions: IAction[]) {
        super(actions);
    }

    async register(name: string): Promise<void> {
        // TODO: Use node-schedule to have a consistent way of handling jobs
        setInterval(async () => {
            await this.execute();
        }, this.interval)
    }

    getDescription(): string {
        return `Alle ${(this.interval / 1000).toFixed(1)} Sekunden`;
    }
}