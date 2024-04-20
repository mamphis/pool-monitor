export abstract class ICondition {
    abstract evaluate(): Promise<boolean>;
}