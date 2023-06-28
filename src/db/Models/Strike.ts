import GuildConfig from "./GuildConfig.js";
import db, { type CountResult } from "../index.js";
import type MaidBoye from "../../main.js";
import { Strings } from "@uwu-codes/utils";
import assert from "node:assert";


export interface StrikeData {
    amount: number;
    blame_id: string | null;
    created_at: Date;
    guild_id: string;
    id: string;
    type: number;
    updated_at: Date | null;
    user_id: string;
}
export type StrikeCreationRequired = Pick<StrikeData, "id" | "guild_id" | "user_id" | "blame_id" | "type">;
export type StrikeCreationIgnored = "created_at" | "updated_at";
export type StrikeUpdateIgnored = "id" | "created_at" | "updated_at";
export type StrikeCreationData = StrikeCreationRequired & Partial<Omit<StrikeData, keyof StrikeCreationRequired | StrikeCreationIgnored>>;
export type StrikeUpdateData = Partial<Omit<StrikeData, StrikeUpdateIgnored>>;
export enum StrikeType {
    STRIKE  = 0,
    BAN     = 1,
    SOFTBAN = 2,
    MUTE    = 3,
    KICK    = 4,
    WARNING = 5
}

export default class Strike {
    static TABLE = "strikes";
    _data: StrikeData;
    amount: number;
    blameID: string | null;
    createdAt: Date;
    guildID: string;
    id: string;
    type: StrikeType;
    updatedAt: Date | null;
    userID: string;
    constructor(data: StrikeData) {
        assert(data && data.id, "invalid id found in Strike");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: StrikeCreationData) {
        await GuildConfig.ensureExists(data.guild_id);
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new Strike object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<StrikeData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new Strike(res) : null;
    }

    static async getCountForUser(guild: string, user: string) {
        const { rows: [{ count }] } = await db.query<CountResult>(`SELECT COUNT(*) FROM ${this.TABLE} WHERE guild_id = $1 AND user_id = $2`, [guild, user]);
        return Number(count);
    }

    static async getForUser(guild: string, user: string, order: "ASC" | "DESC" = "ASC") {
        const { rows: res } = await db.query<StrikeData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND user_id = $2 ORDER BY created_at ${order}`, [guild, user]);
        return res.map(r => new Strike(r));
    }

    get typeName() {
        return Strings.ucwords(StrikeType[this.type].replaceAll("_", " "));
    }

    private load(data: StrikeData) {
        this._data       = data;
        this.amount    = data.amount;
        this.blameID   = data.blame_id;
        this.createdAt = data.created_at;
        this.guildID   = data.guild_id;
        this.type      = data.type;
        this.updatedAt = data.updated_at;
        this.userID    = data.user_id;
    }

    async delete() {
        return Strike.delete(this.id);
    }

    async getBlame(client: MaidBoye) {
        return this.blameID === null ? null : client.getUser(this.blameID);
    }

    async getGuild(client: MaidBoye) {
        return client.guilds.get(this.guildID);
    }

    async getUser(client: MaidBoye) {
        return client.getUser(this.userID);
    }
}
