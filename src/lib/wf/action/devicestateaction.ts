import { Action, Condition } from "@nucleus/wf";
import { IO } from "../../peripherals/io";
import { Context } from "../../system/context";

export class DeviceStateAction extends Action.IAction {
    public device!: 'pump' | 'salt';
    public state!: boolean;

    constructor(conditions: Condition.ICondition[]) {
        super(conditions);
    }

    async execute(): Promise<boolean> {
        switch (this.device) {
            case 'salt':
                if (Context.it.saltState === this.state) {
                    return false;
                }

                await IO.it.setSaltState(this.state);
                break;
            case 'pump':
                if (Context.it.pumpState === this.state) {
                    return false;
                }

                await IO.it.setPumpState(this.state);
                break;
        }

        return true;
    }

    private getDeviceName(): string {
        switch (this.device) {
            case 'salt':
                return 'der Salzanlage';
            case 'pump':
                return 'der Pumpe';
            default:
                return 'von <unbekannt>';
        }
    }
    private getState(): string {
        return this.state ? 'An' : 'Aus';
    }

    getDescription(): string {
        return `Setze den Status ${this.getDeviceName()} auf "${this.getState()}"`
    }

    persist(): Partial<DeviceStateAction> {
        return {
            device: this.device,
            state: this.state,
        };
    }
}