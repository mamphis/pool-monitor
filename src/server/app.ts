import { Server } from "./server";

export async function start() {
    const server = new Server(3000);
    await server.config();
    await server.start();
}