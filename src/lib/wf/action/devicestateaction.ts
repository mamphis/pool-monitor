import { IO } from "../../peripherals/io";
import { Context } from "../../system/context";
import { ICondition } from "../condition/icondition";
import { IAction } from "./iaction";

export class DeviceStateAction extends IAction {
    constructor(public readonly device: 'pump' | 'salt', public readonly state: boolean, conditions: ICondition[]) {
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
}