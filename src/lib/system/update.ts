import { exec, spawn } from 'child_process';
import semver from 'semver';
import simpleGit from "simple-git/promise";
import { Context } from "./context";

export async function newerVersionAvailable(): Promise<boolean> {
    const latestTag = await getLatestVersionTag();
    return semver.gt(latestTag, Context.it.installedVersion, { includePrerelease: true });
}

export async function getLatestVersionTag(): Promise<string> {
    const git = simpleGit()

    await git.fetch()
    const tags = await git.tags();
    if (tags.latest) {
        return tags.latest;
    }

    return '0.0.0';
}

export async function pullLatestVersion() {
    const git = simpleGit()
    await git.fetch();
    await git.checkoutLatestTag('', '')
    Context.it.installedVersion = await getLatestVersionTag();
}

export async function installDependencies(): Promise<void> {
    return new Promise<void>((res) => {
        exec('npm i', (err, stdout, stderr) => {
            res();
        });
    })
}

export async function installApplication(): Promise<void> {
    return new Promise<void>((res) => {
        exec('npm run build', (err, stdout, stderr) => {
            res();
        });
    })
}

export async function restartApplication() {
    setTimeout(function () {
        // When NodeJS exits
        process.once("exit", function () {
            const child = spawn(process.argv.shift() ?? '', process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: "inherit"
            });
        });
        process.exit();
    }, 1000);
}