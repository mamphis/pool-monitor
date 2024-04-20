export abstract class ICondition {
    abstract evaluate(): Promise<boolean>;
    abstract getDescription(): string;
}