import Lcd from 'lcd';
import { TemperatureSensorManager } from './temperature';
import CONST from './consts';
import { Context } from './context';

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
            // this.lcd.clear()
            this.printable = true;
            let cnt = 0;
            setInterval(() => {
                if (!this.displayTime) {
                    return;
                }

                lcd.setCursor(0, 0);
                lcd.print(cnt + ': ' + Buffer.from([cnt++]).toString());

                // lcd.print(`Pumpe: ${Context.it.pumpState ? 'an ' : 'aus'} | Filter: ${Context.it.filterState ? 'an ' : 'aus'}`, function () {
                //     lcd.setCursor(0, 1);
                //     lcd.print(`${new Date().toLocaleTimeString()}   sc: ${TemperatureSensorManager.it.sensors.length}`);
                // });
            }, 500);
        });
    }

    killDisplay() {
        const lcd = this.lcd;
        lcd.clear(() => {
            try {
                lcd.close();
            } catch (e) {
                console.warn(`Error while closing the display: ${e.message}`);
            }
        });

        Display.instance = undefined;
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
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print((lines[0] || ''), function () {
            lcd.setCursor(0, 1);
            lcd.print((lines[1] || ''), function () {
                console.log(`printend: [0]: ${lines[0]}; [1]: ${lines[1]}`)
            });
        });
    }
}