import { Display } from "../lib/display";
import { Server } from "./server";

export async function start() {
    const server = new Server(3000);
    Display.it;

    await server.config();
    await server.start();
}