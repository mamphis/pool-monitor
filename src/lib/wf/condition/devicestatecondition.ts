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
}