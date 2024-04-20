import EventEmitter from "node:events";
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

    private ready: boolean = false;
    private constructor() {
        super();

        this.btnFilter = new Gpio(CONST.PIN_BUTTON_FILTER, 'in', 'rising');
        this.btnPump = new Gpio(CONST.PIN_BUTTON_PUMP, 'in', 'rising');

        this.rlsFilter = new Gpio(CONST.PIN_RELAIS_FILTER, 'out');
        this.rlsPump = new Gpio(CONST.PIN_RELAIS_PUMP, 'out');
    }

    private btnPump: Gpio;
    private btnFilter: Gpio;

    private rlsPump: Gpio;
    private rlsFilter: Gpio;

    private async init() {
        const timer = (ms: number) => new Promise(res => setTimeout(res, ms));
        this.btnPump.watch((err, value) => {
            if (err) {
                return console.warn(err);
            }

            if (value == 1) {
                Context.it.pumpState = !Context.it.pumpState;
                this.rlsPump.write(Context.it.pumpState ? 1 : 0);
            }
        });

        this.btnFilter.watch(async (err, value) => {
            if (err) {
                return console.warn(err);
            }

            if (value == 1) {
                Context.it.filterState = !Context.it.filterState;
                await this.rlsFilter.write(1);
                timer(500);
                await this.rlsFilter.write(0);
            }
        });
    }
}