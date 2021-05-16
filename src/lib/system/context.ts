import { JsonDB } from 'node-json-db';
import { access, readFile, writeFile } from "fs/promises";
import { hash } from 'bcrypt';
import { TemperatureSensorManager } from "../peripherals/temperature";
import moment, { Moment } from 'moment';

export interface LogEntry {
    value: number;
    timestamp: number;
}

export interface Device {
    log: Array<LogEntry>;
    name: string;
}

export interface TempSensor {
    sensor: string;
    name: string;
    temperature: number;
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
        this.update();
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
            // this.cleanTempLog(s);

            this.saveConfig();
            return { sensor: s, name: this.getTempName(s), temperature: t ?? 0 };
        }));
    }

    private cleanTempLog(device: string) {
        const logData = (this.database.getData(`/temp/${device}/log`) as Array<{ timestamp: number, value: number }>).sort((a, b) => a.timestamp - b.timestamp);
        const cleanData = [];
        let lastData: { timestamp: number, value: number, mom: Moment } | undefined = undefined;;
        for (const data of logData) {
            // Add the first event.
            if (cleanData.length == 0) {
                cleanData.push(data);
                lastData = { ...data, mom: moment(new Date(data.timestamp)) };
                continue;
            }

            // if data is longer away then a week, only take every 10 minutes
            const mom = moment(new Date(data.timestamp));
            if (mom.isBefore(moment().subtract(1, 'week'))) {
                if (lastData && lastData.mom.diff(mom, 'minute') >= 10) {
                    cleanData.push(data);
                    lastData = { ...data, mom };
                }
            }


            // if data is longer away then a day, only take every 1 minute
            if (mom.isBefore(moment().subtract(1, 'day'))) {
                if (lastData && lastData.mom.diff(mom, 'minute') >= 1) {
                    cleanData.push(data);
                    lastData = { ...data, mom };
                }
            }
        }

        this.database.push(`/temp/${device}/log`, cleanData);
    }

    private async saveConfig() {
        await writeFile(this.configPath, JSON.stringify({
            _users: this._users,
            _saltState: this._saltState,
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

    async setTempName(device: string, name: string) {
        this.database.push(`/temp/${device}/name`, name);
        await this.saveConfig();
    }

    getTempName(device: string): string {
        if (this.database.exists(`/temp/${device}/name`)) {
            return this.database.getData(`/temp/${device}/name`);
        }

        return device;
    }

    private _users: { [username: string]: string } = {};
    private _saltState: boolean = false;
    private _pumpState: boolean = false;
    private _sensors: Array<TempSensor> = [];
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

    get saltState() {
        return this._saltState;
    }

    set saltState(state) {
        this._saltState = state;
        this.log('salt', '', state ? 1 : 0);
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

    get lastIOStates(): { salt: boolean, pump: boolean, interval: number, temperatures: Array<TempSensor> } {
        return {
            salt: this._saltState,
            pump: this._pumpState,
            temperatures: this._sensors,
            interval: this._updateInterval,
        }
    }

    get temperatures(): { [name: string]: Device } {
        if (this.database.exists('/temp')) {
            return this.database.getData('/temp');
        } else {
            return {};
        }
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