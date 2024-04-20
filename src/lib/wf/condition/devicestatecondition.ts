import { Context } from "../../context";
import { ICondition } from "./icondition";

export class DeviceStateCondition extends ICondition {
    constructor(public readonly device: 'pump' | 'filter', public readonly state: boolean) {
        super();
    }

    async evaluate(): Promise<boolean> {
        switch (this.device) {
            case 'pump':
                return Context.it.pumpState === this.state;
            case 'filter':
                return Context.it.filterState === this.state;
            default:
                return false;
        }
    }

    private getDeviceName(): string {
        switch (this.device) {
            case 'filter':
                return 'Filter';
            case 'pump':
                return 'Pumpe';
            default:
                return '<unbekannt>';
        }
    }
    private getState(): string {
        return this.state ? 'An' : 'Aus';
    }

    getDescription(): string {
        return `wenn der Status der ${this.getDeviceName()} "${this.getState()}" ist.`
    }
}