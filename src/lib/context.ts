import { access, readFile, writeFile } from "fs/promises";
import { hash } from 'bcrypt';

export class Context {
    private static instance?: Context;

    static get it(): Context {
        if (!this.instance) {
            this.instance = new Context();
            this.instance.init();
        }

        return this.instance;
    }

    private constructor() {

    }

    private readonly configPath = './config.json';

    private async existsConfig(): Promise<boolean> {
        try {
            await access(this.configPath);
            return true;
        } catch {
            return false;
        }
    }

    private async init() {
        if (!await this.existsConfig()) {
            this._users['admin'] = await hash('admin', 10);
            await this.saveConfig();
        }

        await this.loadConfig();
    }

    private async saveConfig() {
        await writeFile(this.configPath, JSON.stringify({
            _users: this._users,
            _filterState: this._filterState,
            _pumpState: this._pumpState,
        }));
    }

    private async loadConfig() {
        const content =  (await readFile(this.configPath)).toString()
        Object.assign(this, JSON.parse(content));
    }

    private _users: { [username: string]: string } = {};
    private _filterState: boolean = false;
    private _pumpState: boolean = false;

    get users() {
        return this._users;
    }

    set users(users) {
        this._users = users;
        this.saveConfig();
    }
    
    get filterState() {
        return this._filterState;
    }

    set filterState(state) {
        this._filterState = state;
        this.saveConfig();
    }
    get pumpState() {
        return this._pumpState;
    }

    set pumpState(state) {
        this._pumpState = state;
        this.saveConfig();
    }
}