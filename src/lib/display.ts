import { promisify } from 'util';
import Lcd from 'lcd';

export class Display {
    private static instance: Display;

    static get it(): Display {
        if (!this.instance) {
            this.instance = new Display();
        }

        return this.instance;
    }

    private lcd: Lcd;
    private printable: boolean = false;

    private readonly cols: number = 16;
    private readonly rows: number = 2;

    private constructor() {
        this.lcd = new Lcd({
            rs: 12,
            e: 13,
            data: [16, 19, 20, 26],
            cols: this.cols,
            rows: this.rows
        });

        process.on('SIGINT', () => {
            this.lcd.clear();
            this.lcd.close();
        });

        this.lcd.on('ready', () => {
            console.log(`Display is ready to show something.`);
            this.lcd.clear()
            this.printable = true;
        });
    }

    async setText(text: string) {
        if (!this.printable) {
            return;
        }

        const lines = text.split('\n');
        this.lcd.setCursor(0, 0);
        this.lcd.print((lines[0] || '').substr(0, this.cols));
        this.lcd.setCursor(0, 1);
        this.lcd.print((lines[1] || '').substr(0, this.cols));
    }
}