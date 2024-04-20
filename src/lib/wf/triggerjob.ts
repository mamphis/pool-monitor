import { Moment } from "moment";

export interface TriggerJob {
    cancel(): void;
    nextInvocation(): Moment | undefined;
}