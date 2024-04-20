import Lcd from 'lcd';

export class Display {
    private static instance: Display;


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

        process.on('SIGINT', () => {
            this.lcd.clear();
            this.lcd.close();
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
        lcd.setCursor(0, 0, () => {
            lcd.print((lines[0] || ''), () => {
                lcd.setCursor(0, 1, () => {
                    lcd.print((lines[1] || ''), () => {
                        console.log(`printend: [0]: ${lines[0]}; [1]: ${lines[1]}`)
                    });
                });
            });
        });
    }
}