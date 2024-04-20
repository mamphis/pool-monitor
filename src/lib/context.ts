import { JsonDB } from 'node-json-db';
import { access, readFile, writeFile } from "fs/promises";
import { hash } from 'bcrypt';
import { TemperatureSensorManager } from "./temperature";

export interface LogEntry {
    value: number;
    timestamp: number;
}

export interface Device {
    log: Array<LogEntry>
}


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
        this.database = new JsonDB(this.databasePath, true);
    }

    private readonly configPath = './config.json';
    private readonly databasePath = './database.json';

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
        this.reScheduleUpdate();
    }

    private reScheduleUpdate() {
        clearInterval(this._updateIntervalHandle);
        this._updateIntervalHandle = setInterval(async () => {
            await this.update();
        }, this._updateInterval) as unknown as number;
    }

    private async update() {
        this._sensors = await Promise.all(TemperatureSensorManager.it.sensors.map(async (s) => {
            const t = await TemperatureSensorManager.it.sensor[s]?.getTemperature();
            this.log('temp', s, t ?? 0);
            this.saveConfig();
            return { sensor: s, temperature: t ?? 0 };
        }));
    }

    private async saveConfig() {
        await writeFile(this.configPath, JSON.stringify({
            _users: this._users,
            _filterState: this._filterState,
            _pumpState: this._pumpState,
            _updateInterval: this._updateInterval,
        }));
    }

    private async loadConfig() {
        const content = (await readFile(this.configPath)).toString()
        Object.assign(this, JSON.parse(content));
    }

    private log(device: string, name: string, value: number) {
        this.database.push(`/${device}${name != '' ? '/' + name : ''}/log[]`, {
            timestamp: new Date().getTime(),
            value: value
        });
    }

    private _users: { [username: string]: string } = {};
    private _filterState: boolean = false;
    private _pumpState: boolean = false;
    private _sensors: Array<{ sensor: string, temperature: number }> = [];
    private _updateInterval: number = 2000;
    private _updateIntervalHandle?: number;
    private database: JsonDB;

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
        this.log('filter', '', state ? 1 : 0);
        this.saveConfig();
    }

    get pumpState() {
        return this._pumpState;
    }

    set pumpState(state) {
        this._pumpState = state;
        this.log('pump', '', state ? 1 : 0);
        this.saveConfig();
    }

    get lastIOStates(): { filter: boolean, pump: boolean, interval: number, temperatures: Array<{ sensor: string, temperature: number }> } {
        return {
            filter: this._filterState,
            pump: this._pumpState,
            temperatures: this._sensors,
            interval: this._updateInterval,
        }
    }

    get temperatures(): { [name: string]: Device } {
        return this.database.getData('/temp');
    }

    get updateInterval(): number {
        return this._updateInterval;
    }

    set updateInterval(interval: number) {
        this._updateInterval = interval;
        this.reScheduleUpdate();
        this.saveConfig();
    }
}