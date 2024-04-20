export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
import os from 'os';
import { createHash, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';

export const systemData = () => {
    const ifs = os.networkInterfaces();

    return {
        proc: {
            pid: process.pid,
            uptime: process.uptime(),
            cpu: process.cpuUsage(),
            ram: process.memoryUsage().rss,
        },
        sys: {
            uptime: os.uptime(),
            mem: {
                total: os.totalmem(),
                free: os.freemem(),
            },
            cpus: os.cpus().map(cpu => {
                return {
                    user: cpu.times.user,
                    system: cpu.times.sys,
                    speed: cpu.speed,
                };
            }),
            hostname: os.hostname(),
            ifs: Object.keys(ifs).map(name => {
                const intf = ifs[name];
                if (!intf) return;
                return {
                    name,
                    addr: intf.map(i => {
                        return {
                            address: i.address,
                            mask: i.netmask,
                            mac: i.mac,
                            internal: i.internal,
                            family: i.family
                        }
                    }),
                };
            })
        }
    };
}

export const randomString = (length: number): string => {
    // return randomBytes(length).toString('base64').substring(0, length);
    return nanoid(length)
}

export const hash = (text: string): string => {
    const sha = createHash('sha256'); 
    sha.update(text);

    return sha.digest().toString('hex');
}