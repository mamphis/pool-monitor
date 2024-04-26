import EventEmitter from "events";
import { BinaryValue, Gpio } from "onoff";
import CONST from '../system/consts';
import { Context } from "../system/context";
import { sleep } from "../utils";
import { Display } from "./display";

export interface IO {
    on(event: 'buttonPressed', listener: (which: 'salt' | 'pump' | 'light', newState: boolean) => void): this;
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

        this.btnSalt = new Gpio(CONST.PIN_BUTTON_SALT, 'in', 'rising', { debounceTimeout: 500 });
        this.btnPump = new Gpio(CONST.PIN_BUTTON_PUMP, 'in', 'rising', { debounceTimeout: 500 });
        this.btnLight = new Gpio(CONST.PIN_BUTTON_LIGHT, 'in', 'both', { debounceTimeout: 500 });
        this.rlsSalt = new Gpio(CONST.PIN_RELAIS_SALT, 'out');
        this.rlsPump = new Gpio(CONST.PIN_RELAIS_PUMP, 'out');

        this.pinDisplayLight = new Gpio(CONST.PIN_DISPLAY_LIGHT, 'out');
    }

    private btnPump?: Gpio;
    private btnSalt?: Gpio;
    private btnLight?: Gpio;

    private rlsPump?: Gpio;
    private rlsSalt?: Gpio;
    private pinDisplayLight?: Gpio;

    private async init() {
        let darkenTimer: any;

        const turnOnLight = (buttonSate: BinaryValue) => {
            if (buttonSate !== 1) { return; }

            this.setDisplayLightState(true);
            if (darkenTimer !== undefined) {
                clearTimeout(darkenTimer);
            }

            setImmediate(async () => {
                while (darkenTimer !== undefined) {
                    this.setDisplayLightState(true);
                    await sleep(500);
                }
            });

            darkenTimer = setTimeout(() => {
                this.setDisplayLightState(false);
                darkenTimer = undefined;
            }, 10000);
        }

        this.btnPump?.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            await this.togglePumpState();
            this.emit('buttonPressed', 'pump', Context.it.pumpState);
            turnOnLight(value);
        });

        this.btnSalt?.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            await this.toggleSaltState();
            this.emit('buttonPressed', 'salt', Context.it.saltState);
            turnOnLight(value);
        });

        this.btnLight?.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            this.emit('buttonPressed', 'light', value === 1);
            this.setDisplayLightState(value === 1);
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
        const currentState = await this.pinDisplayLight?.read();
        const desiredState = state ? 1 : 0;

        if (currentState === desiredState) {
            return;
        }

        await this.pinDisplayLight?.write(desiredState);
    }
}