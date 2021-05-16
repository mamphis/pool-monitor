import { Context } from "../lib/system/context";
import { Display } from "../lib/peripherals/display";
import { IO } from "../lib/peripherals/io";
import { TemperatureSensorManager } from "../lib/peripherals/temperature";
import { Trigger } from "../lib/system/trigger";
import { Server } from "./server";

export async function start() {
    const server = new Server(3000);
    Display.it;
    TemperatureSensorManager.it;
    IO.it;
    Trigger.it;

    await server.config();
    await server.start();

    process.on('SIGINT', () => {
        Display.it.killDisplay();
        process.exit(0);
    });

    setTimeout(() => {
        console.log(`Setting states to match config.`);
        IO.it.setSaltState(Context.it.saltState);
        IO.it.setPumpState(Context.it.pumpState);
    }, 10000);
}