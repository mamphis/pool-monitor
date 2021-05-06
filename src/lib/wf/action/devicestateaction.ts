import { Context } from "../../context";
import { IO } from "../../io";
import { ICondition } from "../condition/icondition";
import { IAction } from "./iaction";

export class DeviceStateAction extends IAction {
    constructor(public readonly device: 'pump' | 'filter', public readonly state: boolean, conditions: ICondition[]) {
        super(conditions);
    }

    async execute(): Promise<void> {
        switch (this.device) {
            case 'filter':
                await IO.it.setFilterState(this.state);
            case 'pump':
                await IO.it.setPumpState(this.state);
        }
    }

    private getDeviceName(): string {
        switch (this.device) {
            case 'filter':
                return 'des Filters';
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