import EventEmitter from "events";
import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";

export interface ITrigger {
    on(event: 'triggered', listener: (trigger: ITrigger) => void): this;
    on(event: 'actionExecuted', listener: (trigger: ITrigger, action: IAction) => void): this;
}

export abstract class ITrigger extends EventEmitter {
    enabled: boolean = true;

    constructor(public actions: IAction[]) {
        super();
    }

    protected async execute(): Promise<void> {
        this.emit('triggered', this);
        action: for (const action of this.actions) {
            for (const condition of action.conditions) {
                if (!await condition.evaluate()) {
                    continue action;
                }
            }

            await action.execute();
            this.emit('actionExecuted', this, action);
        }
    }

    abstract getDescription(): string;
    abstract register(name: string): Promise<TriggerJob>;
}