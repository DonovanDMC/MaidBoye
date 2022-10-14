import db from "../db/index.js";


export interface BaseState {
    action: string;
    command: string| null;
    id: number;
    user: string | null;
}

export class State {
    static MAX_LENGTH = 100;
    action: string;
    command: string | null;
    extraKeys: Array<string> = [];
    extraTypes: Array<"string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"> = [];
    extraValues: Array<string | number | boolean | null> = [];
    id: number;
    user: string | null;
    static cancel(user: string) {
        return this.new(user, null, "cancel").encode();
    }

    static decode<T extends Record<string, unknown>>(data: string, extraNames?: Array<string>, extraTypes?: Array<string>, sep = ","): BaseState & T {
        const names = [
            "user",
            "command",
            "action",
            ...(extraNames || [])
        ];
        const types = [
            "string",
            "string",
            "string",
            ...(extraTypes || [])
        ];
        const d = Buffer.from(data, "base64url").toString("ascii").split(sep).map((val, index) => {
            let value: unknown;
            if (val === "NULL") value = null;
            else switch (types[index]) {
                case "undefined": {
                    value = undefined;
                    break;
                }
                case "boolean": {
                    value = Boolean(val);
                    break;
                }
                case "number": {
                    value = Number(val);
                    break;
                }
                case "bigint": {
                    value = BigInt(val);
                    break;
                }
                default: {
                    value = val;
                    break;
                }
            }
            return { [names[index] || `unknown${index}`]: value };
        }).reduce((a, b) => ({ ...a, ...b }), {}) as BaseState & T;
        const id = Number(d.action.slice(-1));
        if (!isNaN(id)) {
            d.action = d.action.slice(0, -1);
            d.id = id ?? 0;
        } else d.id = 0;
        return d;
    }

    static encode(data: Array<string | number | boolean | null>, sep = ",") {
        const str = Buffer.from(data.map(d => d === null ? "NULL" : d).join(sep)).toString("base64url").replace(/=/g, "");
        if (str.length > this.MAX_LENGTH) throw new Error(`encoded state is longer than ${this.MAX_LENGTH} (${str})`);
        return str;
    }

    static exit(user: string) {
        return this.new(user, null, "exit").encode();
    }

    static async fullDecode<T extends Record<string, unknown>>(data: string, sep = ",") {
        const one = this.decode(data);
        const { names, types } = await this.getNamesAndTypes(one.command, one.action, one.id);
        return this.decode<T>(data, names, types, sep);
    }

    static async getNamesAndTypes(cmd: string | null, action: string, id: number) {
        const names = await db.redis.get(`state-names:${cmd || "GENERAL"}:${action}${id}`).then(val => val === null ? [] : JSON.parse(val) as Array<string>);
        const types = await db.redis.get(`state-types:${cmd || "GENERAL"}:${action}${id}`).then(val => val === null ? [] : JSON.parse(val) as Array<string>);
        return { names, types };
    }

    static new(user: string | null, command: string | null, action: string, id = 0) {
        const q = new State();
        q.user = user;
        q.command = command;
        /** an id is added on incase duplicate entries happen */
        q.action = `${action}${id}`;
        return q;
    }

    static partialExit() {
        return this.new(null, null, "partial-exit").encode();
    }

    encode() {
        for (const key of Object.keys(this.extraValues)) {
            if (["user", "cmd", "action"].includes(key)) throw new Error(`Provided extra "${key}" for ${this.command || "NONE"}/${this.action} overrides a deault value`);
        }
        void this.saveNamesAndTypes(this.extraKeys, this.extraTypes);
        return State.encode([
            this.user,
            this.command,
            this.action,
            ...(this.extraValues || [])
        ]);
    }

    async saveNamesAndTypes(names: Array<string>, types: Array<string>) {
        // this is *techincally* not completely stateless, but this shouldn't ever be lost, and even then
        // someone else doing whatever creates a button that uses this will recreate the exact same
        // entry so things should be fine
        void db.redis.set(`state-names:${this.command || "GENERAL"}:${this.action}`, JSON.stringify(names));
        void db.redis.set(`state-types:${this.command || "GENERAL"}:${this.action}`, JSON.stringify(types));
    }

    with(key: string, value: string | number | bigint | boolean | null) {
        this.extraValues.push(typeof value === "bigint" ? value.toString() : value);
        this.extraTypes.push(typeof value);
        this.extraKeys.push(key);
        return this;
    }

    /** @deprecated use with(key, value) */
    withExtra(extra: Record<string, string | number | bigint | boolean | null>) {
        for (const [key, value] of Object.entries(extra)) this.with(key, value);
        return this;
    }
}
