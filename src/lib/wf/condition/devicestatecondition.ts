import { Context } from "../../system/context";
import { ICondition } from "./icondition";

export class DeviceStateCondition extends ICondition {
    constructor(public readonly device: 'pump' | 'salt', public readonly state: boolean) {
        super();
    }

    async evaluate(): Promise<boolean> {
        switch (this.device) {
            case 'pump':
                return Context.it.pumpState === this.state;
            case 'salt':
                return Context.it.saltState === this.state;
            default:
                return false;
        }
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
        return `wenn der Status ${this.getDeviceName()} "${this.getState()}" ist.`
    }
}