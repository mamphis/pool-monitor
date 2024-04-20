import { IAction } from "../action/iaction";
import { TriggerJob } from "../triggerjob";

export abstract class ITrigger {
    constructor(public actions: IAction[]) {

    }

    protected async execute(): Promise<void> {
        action: for (const action of this.actions) {
            for (const condition of action.conditions) {
                if (!await condition.evaluate()) {
                    continue action;
                }
            }

            await action.execute();
        }
    }

    abstract getDescription(): string;
    abstract register(name: string): Promise<TriggerJob>;
}