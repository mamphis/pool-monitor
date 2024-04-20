import Lcd from 'lcd';

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
            rs: 12,
            e: 13,
            data: [16, 19, 20, 26],
            cols: this.cols,
            rows: this.rows
        });
        const lcd = this.lcd;

        this.lcd.on('ready', () => {
            console.log(`Display is ready to show something.`);
            // this.lcd.clear()
            this.printable = true;
            setInterval(() => {
                if (!this.displayTime) {
                    return;
                }

                lcd.setCursor(0, 0);
                lcd.print('Current time is:', function () {
                    lcd.setCursor(0, 1);
                    lcd.print(new Date().toLocaleTimeString());
                });
            }, 1000);
        });
    }

    killDisplay() {
        const lcd = this.lcd;
        lcd.clear(() => {
            lcd.close();
        });

        Display.instance = undefined;
    }

    async setText(text: string) {
        if (!this.printable) {
            return;
        }

        this.displayTime = false;
        setTimeout(() => {
            this.displayTime = true;
        }, 5000);

        const lcd = this.lcd;
        const lines = text.split('\n').map(l => l.substr(0, this.cols));
        lcd.setCursor(0, 0);
        lcd.print((lines[0] || ''), function () {
            lcd.setCursor(0, 1);
            lcd.print((lines[1] || ''), function () {
                console.log(`printend: [0]: ${lines[0]}; [1]: ${lines[1]}`)
            });
        });
    }
}