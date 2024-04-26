import Lcd from 'lcd';
import CONST from '../system/consts';
import { Context } from '../system/context';
import { sleep } from '../utils';
import { IO } from './io';

export class Display {
    private static instance?: Display;

    static get it(): Display {
        if (!this.instance) {
            this.instance = new Display();
        }

        return this.instance;
    }

    private lcd;
    private printable: boolean = false;
    private displayTime = true;

    private readonly cols: number = 16;
    private readonly rows: number = 2;

    private constructor() {
        if (process.platform == 'win32') {
            return;
        }

        this.lcd = new Lcd({
            rs: CONST.PIN_DISPLAY_RS,
            e: CONST.PIN_DISPLAY_E,
            data: [CONST.PIN_DISPLAY_DATA1, CONST.PIN_DISPLAY_DATA2, CONST.PIN_DISPLAY_DATA3, CONST.PIN_DISPLAY_DATA4],
            cols: this.cols,
            rows: this.rows
        });
        const lcd = this.lcd;

        this.lcd.on('ready', () => {
            console.log(`Display is ready to show something.`);
            this.printable = true;
            let cnt = 0;
            const refreshDisplay: () => Promise<void> = async () => {
                if (!this.displayTime) {
                    setTimeout(refreshDisplay, 500);
                    return;
                }

                lcd.setCursor(0, 0);
                let sensorIndex = cnt % Context.it.lastIOStates.temperatures.length;
                if (isNaN(sensorIndex)) {
                    sensorIndex = 0;
                }

                const sensor = Context.it.lastIOStates.temperatures[sensorIndex];
                const sensorText = `S${sensorIndex + 1} ${(sensor?.temperature ?? 0).toFixed(2).padStart(5, '0')}C`;

                lcd.print(`P: ${Context.it.pumpState ? 'x' : 'o'}   ${sensorText}`, async function () {
                    lcd.setCursor(0, 1);
                    lcd.print(`S: ${Context.it.saltState ? 'x' : 'o'}    ${new Date().toLocaleTimeString()}`);
                });

                setTimeout(refreshDisplay, 500);
            };

            setInterval(() => cnt++, 10000);

            this.lcd?.clear()
            refreshDisplay();
        });
    }

    killDisplay() {
        if (!this.printable) {
            return;
        }

        const lcd = this.lcd;
        lcd?.clear(() => {
            try {
                lcd.close();
            } catch (e: any) {
                console.warn(`Error while closing the display: ${e.message}`);
            }

            this.printable = false;
            Display.instance = undefined;
        });

    }

    async setText(text: string) {
        if (!this.printable) {
            return;
        }

        if (!text) {
            return;
        }

        this.displayTime = false;
        setTimeout(() => {
            this.displayTime = true;
        }, 5000);

        const lcd = this.lcd;
        const lines = text.split('\n').map(l => l.substr(0, this.cols).trim());
        lcd?.clear();
        lcd?.setCursor(0, 0);
        lcd?.print((lines[0] || ''), function () {
            lcd.setCursor(0, 1);
            lcd.print((lines[1] || ''), function () {
                console.log(`printend: [0]: ${lines[0]}; [1]: ${lines[1]}`)
            });
        });
    }
}