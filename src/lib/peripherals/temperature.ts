import { access, readdir, readFile } from 'fs/promises';
import { join } from 'path';

class TemperatureSensor {
    constructor(private manager: TemperatureSensorManager, public readonly id: string) {
    }

    async getTemperature(): Promise<number> {
        const deviceTemperaturePath = join(this.manager.devicePath, this.id, 'temperature');
        try {
            const stats = await access(deviceTemperaturePath);
        } catch (e) {
            console.warn(`Cannot get a temperature for device "${this.id}": ${e.message}`);
            return 0;
        }

        const data = await readFile(deviceTemperaturePath)
        const millidegrees = parseInt(data.toString());

        return millidegrees / 1000;
    }

    async getTemperatureFormatted(temp?: number): Promise<string> {
        if (!temp) {
            temp = await this.getTemperature();
        }
        
        return `${temp.toFixed(3)} °C`;
    }
}

export class TemperatureSensorManager {
    private static instance?: TemperatureSensorManager;

    static get it(): TemperatureSensorManager {
        if (!this.instance) {
            this.instance = new TemperatureSensorManager();
            this.instance.init();
        }

        return this.instance;
    }

    private _sensors: TemperatureSensor[] = [];
    readonly devicePath = `/sys/bus/w1/devices`;

    private ready: boolean = false;

    private constructor() {
    }

    private async init() {
        if (this.ready) {
            return;
        }

        if (process.platform === 'win32') {
            return;
        }

        const devices = await readdir(this.devicePath);
        const sensors = devices.filter(d => /\d{2}-[\da-f]{12}/.test(d));

        this._sensors = sensors.map(s => new TemperatureSensor(this, s));
        this._sensors.forEach(s => this.sensor[s.id] = s);
        this.ready = true;
    }

    get sensors(): string[] {
        return [...this._sensors.map(s => s.id)];
    }

    sensor: { [id: string]: TemperatureSensor | undefined } = {};
}