import moment from "moment";
import { DeviceStateAction } from "./action/devicestateaction";
import { IAction } from "./action/iaction";
import { DeviceStateCondition } from "./condition/devicestatecondition";
import { ICondition } from "./condition/icondition";
import { IntervalTrigger } from "./trigger/intervaltrigger";
import { ITrigger } from "./trigger/itrigger";
import { RecurrentTrigger } from "./trigger/recurrenttrigger";
import { TimestampTrigger } from "./trigger/timestamptrigger";

export class PersistanceManager {
    static persist(trigger: ITrigger): string {
        let triggerObj: any = {};
        triggerObj.name = trigger.constructor.name;
        triggerObj.enabled = trigger.enabled;

        if (trigger instanceof RecurrentTrigger) {
            triggerObj.hour = trigger.rule.hour as number;
            triggerObj.minute = trigger.rule.minute as number;
            triggerObj.dayOfWeek = trigger.rule.dayOfWeek;
        } else if (trigger instanceof IntervalTrigger) {
            triggerObj.interval = trigger.interval;
        } else if (trigger instanceof TimestampTrigger) {
            triggerObj.time = trigger.time.unix();
        }

        triggerObj.actions = this.persistActions(trigger.actions);

        return JSON.stringify(triggerObj);
    }

    private static persistActions(actions: IAction[]): any {
        return actions.map(action => {
            const actionObj: any = {};
            actionObj.name = action.constructor.name;

            if (action instanceof DeviceStateAction) {
                actionObj.device = action.device;
                actionObj.state = action.state;
            }

            actionObj.conditions = this.persistConditions(action.conditions);

            return actionObj;
        });
    }

    private static persistConditions(conditions: ICondition[]): any {
        return conditions.map(condition => {
            const conditionObj: any = {};
            conditionObj.name = condition.constructor.name;

            if (condition instanceof DeviceStateCondition) {
                conditionObj.device = condition.device;
                conditionObj.state = condition.state;
            }

            return conditionObj;
        });
    }

    static fromString(value: string): ITrigger {
        const triggerObj = JSON.parse(value);
        let trigger;
        let actions = this.fromStringActions(triggerObj.actions);

        switch (triggerObj.name) {
            case 'RecurrentTrigger':
                trigger = new RecurrentTrigger([triggerObj.hour, triggerObj.minute, triggerObj.dayOfWeek ?? [0, 1, 2, 3, 4, 5, 6]], actions);
                break;

            case 'IntervalTrigger':
                trigger = new IntervalTrigger(triggerObj.interval, actions);
                break;

            case 'TimestampTrigger':
                trigger = new TimestampTrigger(moment.unix(triggerObj.time), actions);
                break;

            default:
                throw new Error(`Invalid trigger constructor: ${triggerObj.name}`);
        }

        trigger.enabled = triggerObj.enabled ?? true;
        return trigger;
    }

    private static fromStringActions(actionsObj: any): IAction[] {
        const actions: IAction[] = actionsObj.map((actionObj: any) => {
            let action;
            let conditions = this.fromStringConditions(actionObj.conditions);

            switch (actionObj.name) {
                case 'DeviceStateAction':
                    action = new DeviceStateAction(conditions);
                    action.device = actionObj.device;
                    action.state = actionObj.state;
                    break;
                default:
                    throw new Error(`Invalid action constructor: ${actionObj.name}`);
            }

            return action;
        });

        return actions;
    }

    private static fromStringConditions(conditionsObj: any): ICondition[] {
        const conditions: ICondition[] = conditionsObj.map((conditionObj: any) => {
            let condition;
            switch (conditionObj.name) {
                case 'DeviceStateCondition':
                    condition = new DeviceStateCondition();
                    condition.device = conditionObj.device;
                    condition.state = conditionObj.state;
                    break;
                default:
                    throw new Error(`Invalid condition constructor: ${conditionObj.name}`);
            }

            return condition;
        });

        return conditions;
    }
}