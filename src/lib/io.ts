import EventEmitter from "events";
import { Gpio } from "onoff";
import CONST from './consts';
import { Context } from "./context";

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

        this.btnFilter = new Gpio(CONST.PIN_BUTTON_FILTER, 'in', 'falling', { debounceTimeout: 10 });
        this.btnPump = new Gpio(CONST.PIN_BUTTON_PUMP, 'in', 'falling', { debounceTimeout: 10 });

        this.rlsFilter = new Gpio(CONST.PIN_RELAIS_FILTER, 'out');
        this.rlsPump = new Gpio(CONST.PIN_RELAIS_PUMP, 'out');
    }

    private btnPump: Gpio;
    private btnFilter: Gpio;

    private rlsPump: Gpio;
    private rlsFilter: Gpio;

    private async init() {
        this.btnPump.watch(async (err, value) => {
            console.log("btnPump Pressed:  " + value)
            if (err) {
                return console.warn(err);
            }

            if (value == 1) {
                await this.togglePumpState();
            }
        });

        this.btnFilter.watch(async (err, value) => {
            console.log("btnFilter Pressed:  " + value)
            if (err) {
                return console.warn(err);
            }

            if (value == 1) {
                await this.toggleFilterState();
            }
        });
    }

    async setPumpState(state: boolean) {
        await this.rlsPump.write(Context.it.pumpState ? 1 : 0);
        Context.it.pumpState = state;
    }

    async togglePumpState() {
        await this.setPumpState(!Context.it.pumpState);
    }

    async setFilterState(state: boolean) {
        const timer = (ms: number) => new Promise(res => setTimeout(res, ms));

        if (Context.it.filterState === state) {
            // State is already set to the correct state :^)
            return;
        }

        // Immitade "Swiping Switch"
        await this.rlsFilter.write(1);
        await timer(500);
        await this.rlsFilter.write(0);
        Context.it.filterState = state;
    }

    async toggleFilterState() {
        await this.setFilterState(!Context.it.filterState);
    }
}