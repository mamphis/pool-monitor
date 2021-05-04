declare module 'lcd' {
    export interface LcdConfig {
        cols?: number;
        rows?: number;
        rs: number;
        e: number;
        data: number[];
    }

    export declare class Lcd {
        constructor(config: LcdConfig);
        clear(cb?: (err?: Error) => void);
        close(cb?: (err?: Error) => void);
        setCursor(col: number, row: number, cb?: (err?: Error) => void);
        print(text: string, cb?: (err?: Error) => void);

        on(ev: 'ready', listener: () => void);
    }

    export default Lcd;
}