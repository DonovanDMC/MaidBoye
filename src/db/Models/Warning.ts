import GuildConfig from "./GuildConfig.js";
import type { ModLogData } from "./ModLog.js";
import db from "../index.js";
import type MaidBoye from "../../main.js";
import Debug from "../../util/Debug.js";
import assert from "node:assert";


export interface WarningData {
    blame_id: string;
    created_at: Date;
    guild_id: string;
    id: string;
    reason: string;
    updated_at: Date | null;
    user_id: string;
    warning_id: number;
}
export type WarningCreationRequired = Pick<WarningData, "id" | "guild_id" | "user_id" | "blame_id" | "warning_id" | "reason">;
export type WarningCreationIgnored = "created_at" | "updated_at";
export type WarningUpdateIgnored = "id" | "created_at" | "updated_at";
export type WarningCreationData = WarningCreationRequired & Partial<Omit<WarningData, keyof WarningCreationRequired | WarningCreationIgnored>>;
export type WarningUpdateData = Partial<Omit<WarningData, WarningUpdateIgnored>>;

export default class Warning {
    static TABLE = "warnings";
    _data: WarningData;
    blameID: string;
    createdAt: Date;
    guildID: string;
    id: string;
    reason: string;
    updatedAt: Date | null;
    userID: string;
    warningID: number;
    constructor(data: WarningData) {
        assert(data && data.id, "invalid id found in Warning");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: WarningCreationData) {
        await GuildConfig.ensureExists(data.guild_id);
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new warning object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async fixOrdering(guild: string, user: string) {
        const warnings = await this.getForUser(guild, user);
        let changes = 0, index = 0;
        for (const warning of warnings) {
            index++;
            if (warning.warningID !== index) {
                changes++;
                // hopefully anything that was previously in the way will have already been moved
                await db.query(`UPDATE ${this.TABLE} SET warning_id = $1 WHERE id = $2`, [index, warning.id]);
                Debug("warnings:reorder", `Moved warning #${warning.warningID} to #${index} for user ${user} (wid: ${warning.id})`);
            }
        }
        return [changes, warnings.length + 1] as [changes: number, nextID: number];
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<WarningData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new Warning(res) : null;
    }

    static async getForUser(guild: string, user: string, order: "ASC" | "DESC" = "ASC") {
        const { rows: res } = await db.query<WarningData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND user_id = $2 ORDER BY warning_id ${order}`, [guild, user]);
        const warnings = res.map(r => new Warning(r));
        for (const w of warnings) {
            if (!await w.check()) {
                warnings.splice(warnings.indexOf(w), 1);
            }
        }
        return warnings;
    }

    static async getNextID(guild: string, user: string) {
        return (await this.fixOrdering(guild, user))[1];
    }

    private load(data: WarningData) {
        this._data     = data;
        this.blameID   = data.blame_id;
        this.createdAt = data.created_at;
        this.guildID   = data.guild_id;
        this.reason    = data.reason;
        this.updatedAt = data.updated_at;
        this.userID    = data.user_id;
        this.warningID = data.warning_id;
    }

    async check() {
        const { rows: [log = null] } = await db.query<ModLogData>("SELECT * FROM modlog WHERE warning_id = $1", [this.id]);
        // if we don't have an accompanying modlog entry, delete the warning (if it doesnt exist IN ANY WAY, not if it's marked as deleted)
        if (log === null) {
            await this.delete();
            return false;
        }

        return !log.deleted;
    }

    async delete() {
        return Warning.delete(this.id);
    }

    async getBlame(client: MaidBoye) {
        return client.getUser(this.blameID);
    }

    async getGuild(client: MaidBoye) {
        return client.guilds.get(this.guildID);
    }

    async getUser(client: MaidBoye) {
        return client.getUser(this.userID);
    }
}
