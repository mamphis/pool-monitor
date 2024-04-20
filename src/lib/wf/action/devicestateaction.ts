import { Context } from "../../context";
import { IO } from "../../io";
import { ICondition } from "../condition/icondition";
import { IAction } from "./iaction";

export class DeviceStateAction extends IAction {
    constructor(public readonly device: 'pump' | 'filter', public readonly state: boolean, conditions: ICondition[]) {
        super(conditions);
    }

    async execute(): Promise<void> {
        // throw new Error("Method not implemented.");
    }
}