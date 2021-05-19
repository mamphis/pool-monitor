import { hash } from 'bcrypt';
import { access, readFile, writeFile } from "fs/promises";
import moment, { Moment } from 'moment';
import { JsonDB } from 'node-json-db';
import { IO } from '../peripherals/io';
import { TemperatureSensorManager } from "../peripherals/temperature";
import { Trigger } from './trigger';
import { getLatestVersionTag } from './update';

export interface LogEntry {
    value: number;
    from?: string;
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

export interface VersionInfo {
    latestVersion: string;
    installedVersion: string;
    lastChecked: Moment;
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
        this.updateVersionInfo();

        IO.it.on('buttonPressed', (device, state) => {
            this.logIODevice(device, state ? 1 : 0, 'button');
        });

        Trigger.it.on('deviceStateChanged', (device, state) => {
            this.logIODevice(device, state ? 1 : 0, 'trigger');
        });
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
            this.logTemperature(s, t || 0);
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
            _installedVersion: this._installedVersion,
        }));
    }

    private async loadConfig() {
        const content = (await readFile(this.configPath)).toString()
        Object.assign(this, JSON.parse(content));
    }

    async updateVersionInfo() {
        this._versionInfo = {
            installedVersion: this._installedVersion,
            latestVersion: await getLatestVersionTag(),
            lastChecked: moment(),
        }
    }

    private logTemperature(sensorId: string, value: number) {
        this.database.push(`/temp/${sensorId}/log[]`, {
            timestamp: new Date().getTime(),
            value: value
        });
    }

    logIODevice(device: string, value: number, from: 'button' | 'web' | 'trigger') {
        this.database.push(`/${device}/log[]`, {
            timestamp: new Date().getTime(),
            value,
            from,
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
    private _installedVersion: string = '0.0.0';
    private _versionInfo?: VersionInfo;
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
        this.saveConfig();
    }

    get pumpState() {
        return this._pumpState;
    }

    set pumpState(state) {
        this._pumpState = state;
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

    get devices(): Device[] {
        const devices: Device[] = [];
        if (this.database.exists('/pump')) {
            devices.push({
                name: 'Pumpe',
                log: this.database.getData('/pump/log'),
            });
        }
        if (this.database.exists('/salt')) {
            devices.push({
                name: 'Salzanlage',
                log: this.database.getData('/salt/log'),
            });
        }

        return devices;
    }

    get updateInterval(): number {
        return this._updateInterval;
    }

    set updateInterval(interval: number) {
        this._updateInterval = interval;
        this.reScheduleUpdate();
        this.saveConfig();
    }

    get installedVersion(): string {
        return this._installedVersion;
    }

    set installedVersion(value: string) {
        this._installedVersion = value;
        this.saveConfig();
    }

    get versionInfo(): VersionInfo {
        if (!this._versionInfo) {
            this.updateVersionInfo();
            return {
                installedVersion: this._installedVersion,
                latestVersion: '0.0.0',
                lastChecked: moment('1970-01-01'),
            };
        }

        return this._versionInfo;
    }
}