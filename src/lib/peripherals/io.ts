import EventEmitter from "events";
import { Gpio } from "onoff";
import CONST from '../consts';
import { Context } from "../context";
import { sleep } from "../utils";

export interface IO {
    on(event: 'buttonPressed', listener: (which: 'salt' | 'pump', newState: boolean) => void): this;
}

export class IO extends EventEmitter {
    private static instance?: IO;

    static get it(): IO {
        if (!this.instance) {
            this.instance = new IO();
            this.instance.init();
        }

        return this.instance;
    }

    private constructor() {
        super();

        if (process.platform === 'win32') {
            return;
        }

        this.btnSalt = new Gpio(CONST.PIN_BUTTON_SALT, 'in', 'falling', { debounceTimeout: 10 });
        this.btnPump = new Gpio(CONST.PIN_BUTTON_PUMP, 'in', 'falling', { debounceTimeout: 10 });

        this.rlsSalt = new Gpio(CONST.PIN_RELAIS_SALT, 'out');
        this.rlsPump = new Gpio(CONST.PIN_RELAIS_PUMP, 'out');
        this.pinDisplayLight = new Gpio(CONST.PIN_DISPLAY_LIGHT, 'low');
    }

    private btnPump?: Gpio;
    private btnSalt?: Gpio;

    private rlsPump?: Gpio;
    private rlsSalt?: Gpio;
    private pinDisplayLight?: Gpio;

    private async init() {
        this.btnPump?.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            await this.togglePumpState();
            this.emit('buttonPressed', 'pump', Context.it.pumpState);
        });

        this.btnSalt?.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            await this.toggleSaltState();
            this.emit('buttonPressed', 'salt', Context.it.saltState);
        });
    }

    async setPumpState(state: boolean) {
        await this.rlsPump?.write(state ? 1 : 0);
        Context.it.pumpState = state;
    }

    async togglePumpState() {
        await this.setPumpState(!Context.it.pumpState);
    }

    async setSaltState(state: boolean) {
        if (Context.it.saltState === state) {
            // State is already set to the correct state :^)
            return;
        }

        // Immitade "Swiping Switch"
        await this.rlsSalt?.write(1);
        await sleep(500);
        await this.rlsSalt?.write(0);
        Context.it.saltState = state;
    }

    async toggleSaltState() {
        await this.setSaltState(!Context.it.saltState);
    }

    async setDisplayLightState(state: boolean) {
        await this.pinDisplayLight?.write(state ? 1 : 0);
    }
}