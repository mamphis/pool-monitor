import { PersistanceManager, Trigger as WfTrigger, TriggerJob } from "@nucleus/wf";
import EventEmitter from "events";
import { access, readFile, writeFile } from "fs/promises";
import { DeviceStateAction } from "../wf/action/devicestateaction";
import { DeviceStateCondition } from "../wf/condition/devicestatecondition";

export interface Trigger {
    on(event: 'deviceStateChanged', listener: (device: 'pump' | 'salt', newState: boolean) => void): this;
}

export class Trigger extends EventEmitter {
    private static instance?: Trigger;

    static get it(): Trigger {
        if (!this.instance) {
            this.instance = new Trigger();
            PersistanceManager.registerAction(DeviceStateAction);
            PersistanceManager.registerCondition(DeviceStateCondition);

            this.instance.init();
        }

        return this.instance;
    }

    private constructor() {
        super();
    }

    private readonly configPath = './trigger.json';

    private async existsConfig(): Promise<boolean> {
        try {
            await access(this.configPath);
            return true;
        } catch {
            return false;
        }
    }

    private async init() {
        if (!await this.existsConfig()) {
            await this.saveConfig();
        }

        await this.loadConfig();
    }

    private async saveConfig() {
        await writeFile(this.configPath, JSON.stringify({
            _triggers: this._triggers
        }));
    }

    private async loadConfig() {
        const content = (await readFile(this.configPath)).toString()
        Object.assign(this, JSON.parse(content));

        this.rescheduleJobs();
    }

    private async rescheduleJobs() {
        for (const name in this._triggers) {
            const triggerDef = this._triggers[name];
            if (name in this._job) {
                this._job[name].cancel();
            }

            const trigger = PersistanceManager.fromString(triggerDef);

            trigger.on('actionExecuted', (t, a) => {
                if (a instanceof DeviceStateAction) {
                    this.emit('deviceStateChanged', a.device, a.state);
                }
            });

            const job = await trigger.register(name);
            this._job[name] = job;
        }
    }

    private _triggers: { [name: string]: string } = {};
    private _job: { [name: string]: TriggerJob } = {};

    async add(name: string, triggerDef: string): Promise<boolean> {
        try {
            const t = PersistanceManager.fromString(triggerDef);
            this._triggers[name] = triggerDef;
            await this.saveConfig();

            this.rescheduleJobs();
            return true;
        } catch (e) {
            return false;
        }
    }

    get all(): Array<{ name: string, job: TriggerJob, trigger: WfTrigger.ITrigger }> {
        return Object.keys(this._triggers).map(name => {
            return { name, job: this._job[name], trigger: PersistanceManager.fromString(this._triggers[name]) };
        })
    }

    async delete(name: string) {
        delete this._triggers[name];
        this._job[name].cancel();
        delete this._job[name];

        await this.saveConfig();
    }

    async changeState(name: string, state: boolean) {
        const trigger = PersistanceManager.fromString(this._triggers[name]);
        trigger.enabled = state;

        this._triggers[name] = PersistanceManager.persist(trigger);

        await this.rescheduleJobs();
        await this.saveConfig();
    }
}