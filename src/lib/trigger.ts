import { access, readFile, writeFile } from "fs/promises";
import { PersistanceManager } from "./wf/persistancemanager";
import { ITrigger } from "./wf/trigger/itrigger";
import { TriggerJob } from "./wf/triggerjob";

export class Trigger {
    private static instance?: Trigger;


    static get it(): Trigger {
        if (!this.instance) {
            this.instance = new Trigger();
            this.instance.init();
        }

        return this.instance;
    }

    private constructor() {

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

        for (const name in this._triggers) {
            const triggerDef = this._triggers[name];

            const trigger = PersistanceManager.fromString(triggerDef);
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

            const job = await t.register(name);
            this._job[name] = job;

            await this.saveConfig();
            return true;
        } catch (e) {
            return false;
        }
    }

    get all(): Array<{ name: string, job: TriggerJob, trigger: ITrigger }> {
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
}