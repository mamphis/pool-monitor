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
            this.printable = true;
            let cnt = 0;
            const refreshDisplay = async () => {
                if (!this.displayTime) {
                    return setTimeout(refreshDisplay, 500);
                }

                lcd.setCursor(0, 0);
                const sensors = TemperatureSensorManager.it.sensors;
                const sensorIndex = cnt % sensors.length;
                const sensor = TemperatureSensorManager.it.sensor[sensors[sensorIndex]];
                
                const sensorText = `S${sensorIndex + 1} ${(await sensor?.getTemperature())?.toFixed(2)}C`;

                lcd.print(`P: ${Context.it.pumpState ? 'x' : 'o'}   ${sensorText}`, async function () {
                    lcd.setCursor(0, 1);
                    lcd.print(`F: ${Context.it.filterState ? 'x' : 'o'}    ${new Date().toLocaleTimeString()}`);
                });

                setTimeout(refreshDisplay, 500);
            };
            
            setInterval(() => cnt++, 10000);

            this.lcd.clear()
            refreshDisplay();
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