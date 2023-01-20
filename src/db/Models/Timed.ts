import GuildConfig from "./GuildConfig.js";
import db from "../index.js";
import type MaidBoye from "../../main.js";
import Util from "../../util/Util.js";
import assert from "node:assert";


export interface TimedData {
    created_at: Date;
    expires_at: Date;
    guild_id: string;
    id: string;
    renewed_at: Date | null;
    time: number;
    type: number;
    updated_at: Date | null;
    user_id: string;
}
export type TimedCreationRequired = Pick<TimedData, "id" | "type" | "guild_id" | "user_id" | "time" | "expires_at">;
export type TimedCreationIgnored = "created_at" | "updated_at";
export type TimedUpdateIgnored = "id" | "created_at" | "updated_at";
export type TimedCreationData = TimedCreationRequired & Partial<Omit<TimedData, keyof TimedCreationRequired | TimedCreationIgnored>>;
export type TimedUpdateData = Partial<Omit<TimedData, TimedUpdateIgnored>>;
export enum TimedType {
    BAN  = 0,
    MUTE = 1
}

export default class Timed {
    static TABLE = "timed";
    _data: TimedData;
    createdAt: Date;
    expiresAt: Date;
    guildID: string;
    id: string;
    renewedAt: Date | null;
    time: number;
    type: TimedType;
    updatedAt: Date | null;
    userID: string;
    constructor(data: TimedData) {
        assert(data && data.id, "invalid id found in Timed");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: TimedCreationData) {
        await GuildConfig.ensureExists(data.guild_id);
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new Timed object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<TimedData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new Timed(res) : null;
    }

    private load(data: TimedData) {
        this._data       = data;
        this.createdAt = data.created_at;
        this.expiresAt = data.expires_at;
        this.guildID   = data.guild_id;
        this.renewedAt = data.renewed_at;
        this.time      = data.time;
        this.type      = data.type;
        this.updatedAt = data.updated_at;
        this.userID    = data.user_id;
    }

    async delete() {
        return Timed.delete(this.id);
    }

    async edit(data: TimedUpdateData) {
        const success = await Util.genericEdit(Timed.TABLE, this.id, Util.removeUndefinedKV(data));
        if (success) {
            this.load(Util.removeUndefinedKV({ ...this._data, ...data }));
        }
        return success;
    }

    async getGuild(client: MaidBoye) {
        return client.guilds.get(this.guildID);
    }

    async getUser(client: MaidBoye) {
        return client.getUser(this.userID);
    }
}
