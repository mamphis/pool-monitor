import { Context } from "../lib/context";
import { Display } from "../lib/display";
import { IO } from "../lib/io";
import { TemperatureSensorManager } from "../lib/temperature";
import { Server } from "./server";

export async function start() {
    const server = new Server(3000);
    Display.it;
    TemperatureSensorManager.it;
    IO.it;

    await server.config();
    await server.start();

    process.on('SIGINT', () => {
        Display.it.killDisplay();
        process.exit(0);
    });

    setTimeout(() => {
        console.log(`Setting states to match config.`);
        IO.it.setFilterState(Context.it.filterState);
        IO.it.setPumpState(Context.it.pumpState);
    }, 10000);
}