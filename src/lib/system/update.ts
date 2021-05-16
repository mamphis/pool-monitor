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

