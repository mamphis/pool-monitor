import { access, readFile, writeFile } from "fs/promises";
import { scheduledJobs } from "node-schedule";
import { PersistanceManager } from "./wf/persistancemanager";

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
            await trigger.register(name);
        }
    }

    private _triggers: { [name: string]: string } = {};

    async add(name: string, triggerDef: string): Promise<boolean> {
        try {
            const t = PersistanceManager.fromString(triggerDef);
            this._triggers[name] = triggerDef;

            await t.register(name);
            return true;
        } catch (e) {
            return false;
        }
    }

    get all(): Array<{ name: string, triggerDef: string }> {
        return Object.keys(this._triggers).map(name => {
            return { name, triggerDef: this._triggers[name] };
        })
    }

    async delete(name: string) {
        delete this._triggers[name];
        scheduledJobs['trigger' + name].cancel();
    }
}