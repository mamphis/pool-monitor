import { ICondition } from "../condition/icondition";

export abstract class IAction {
    constructor(public conditions: ICondition[]) {

    }
    
    abstract execute(): Promise<void>;
    abstract getDescription(): string;
}