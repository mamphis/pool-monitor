import { exec, spawn } from 'child_process';
import semver from 'semver';
import simpleGit from "simple-git/promise";
import { Context } from "./context";

export async function newerVersionAvailable(): Promise<boolean> {
    const git = simpleGit()

    await git.fetch()
    const tags = await git.tags();
    if (!tags.latest) {
        return false;
    }

    return semver.gt(tags.latest, Context.it.installedVersion, { includePrerelease: true });
}

export async function pullLatestVersion() {
    const git = simpleGit()
    await git.fetch();
    await git.checkoutLatestTag('', '')
}

export async function installDependencies(): Promise<void> {
    return new Promise<void>((res) => {
        exec('npm i', (err, stdout, stderr) => {
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