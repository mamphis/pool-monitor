import { access, readFile, writeFile } from "fs/promises";
import { hash } from 'bcrypt';
import { TemperatureSensorManager } from "./temperature";

export class Context {
    private static instance?: Context;

    static get it(): Context {
        if (!this.instance) {
            this.instance = new Context();
            this.instance.init();
        }

        return this.instance;
    }

    private constructor() {

    }

    private readonly configPath = './config.json';

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
            this._users['admin'] = await hash('admin', 10);
            await this.saveConfig();
        }

        await this.loadConfig();
        setInterval(async () => {
            this._sensors = await Promise.all(TemperatureSensorManager.it.sensors.map(async (s) => {
                const t = await TemperatureSensorManager.it.sensor[s]?.getTemperature();
                this._log.push({ device: 'temp', deviceName: s, value: t ?? 0 });
                this.saveConfig();
                return { sensor: s, temperature: t ?? 0 };
            }));
        }, 2000);
    }

    private async saveConfig() {
        await writeFile(this.configPath, JSON.stringify({
            _users: this._users,
            _filterState: this._filterState,
            _pumpState: this._pumpState,
            _log: this._log,
        }));
    }

    private async loadConfig() {
        const content = (await readFile(this.configPath)).toString()
        Object.assign(this, JSON.parse(content));
    }

    private _users: { [username: string]: string } = {};
    private _filterState: boolean = false;
    private _pumpState: boolean = false;
    private _sensors: Array<{ sensor: string, temperature: number }> = [];
    private _log: Array<{ device: 'temp' | 'filter' | 'pump', deviceName: string, value: number }> = [];

    get users() {
        return this._users;
    }

    set users(users) {
        this._users = users;
        this.saveConfig();
    }

    get filterState() {
        return this._filterState;
    }

    set filterState(state) {
        this._filterState = state;
        this._log.push({ device: 'filter', deviceName: '', value: state ? 1 : 0 });
        this.saveConfig();
    }

    get pumpState() {
        return this._pumpState;
    }

    set pumpState(state) {
        this._pumpState = state;
        this._log.push({ device: 'pump', deviceName: '', value: state ? 1 : 0 });
        this.saveConfig();
    }

    get lastIOStates(): { filter: boolean, pump: boolean, temperatures: Array<{ sensor: string, temperature: number }> } {
        return {
            filter: this._filterState,
            pump: this._pumpState,
            temperatures: this._sensors,
        }
    }

    get log(): Array<{ device: 'temp' | 'filter' | 'pump', deviceName: string, value: number }> {
        return this._log;
    }
}