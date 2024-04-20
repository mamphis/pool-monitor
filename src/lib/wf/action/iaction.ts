import { ICondition } from "../condition/icondition";

export abstract class IAction {
    constructor(public conditions: ICondition[]) {

    }
    
    abstract execute(): Promise<boolean>;
    abstract getDescription(): string;
}