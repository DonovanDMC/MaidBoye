import Strike from "./Strike.js";
import Timed from "./Timed.js";
import Warning from "./Warning.js";
import GuildConfig from "./GuildConfig.js";
import db from "../index.js";
import type MaidBoye from "../../main.js";
import Util from "../../util/Util.js";
import { Strings } from "@uwu-codes/utils";
import type { AnyGuildTextChannel, Member } from "oceanic.js";
import assert from "node:assert";


export interface ModLogData {
    amount: number | null;
    blame_id: string | null;
    case_id: number;
    channel_id: string | null;
    created_at: Date;
    delete_seconds: number | null;
    deleted: boolean;
    guild_id: string;
    id: string;
    message_id: string | null;
    reason: string;
    reason_hidden: boolean;
    strike_id: string | null;
    target_id: string | null;
    timed_id: string | null;
    type: number;
    updated_at: Date | null;
    updated_by: string | null;
    warning_id: string | null;
}
export type ModLogCreationRequired = Pick<ModLogData, "case_id" | "guild_id" | "reason" | "type">;
export type ModLogCreationIgnored = "created_at" | "updated_at";
export type ModLogUpdateIgnored = "id" | "created_at" | "updated_at";
export type ModLogCreationData = ModLogCreationRequired & Partial<Omit<ModLogData, keyof ModLogCreationRequired | ModLogCreationIgnored>>;
export type ModLogUpdateData = Partial<Omit<ModLogData, ModLogUpdateIgnored>>;
export enum ModLogType {
    BAN            = 0,
    UNBAN          = 1,
    SOFTBAN        = 2,
    MUTE           = 3,
    UNMUTE         = 4,
    KICK           = 5,
    LOCK           = 6,
    UNLOCK         = 7,
    LOCKDOWN       = 8,
    UNLOCKDOWN     = 9,
    WARNING        = 10,
    DELETE_WARNING = 11,
    CLEAR_WARNINGS = 12,
    STRIKE         = 13
}

export default class ModLog {
    static TABLE = "modlog";
    _data: ModLogData;
    amount: number | null;
    blameID: string | null;
    caseID: number;
    channelID: string | null;
    createdAt: Date;
    deleteSeconds: number | null;
    deleted: boolean;
    guildID: string;
    id: string;
    messageID: string | null;
    reason: string;
    reasonHidden: boolean;
    strikeID: string | null;
    targetID: string | null;
    timedID: string | null;
    type: ModLogType;
    updatedAt: Date | null;
    updatedBy: string | null;
    warningID: string | null;
    constructor(data: ModLogData) {
        assert(data && data.id, "invalid id found in ModLog");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: ModLogCreationData) {
        await GuildConfig.ensureExists(data.guild_id);
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new ModLog object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new ModLog(res) :  null;
    }

    static async getCase(guild: string, caseID: number) {
        const { rows: [res] } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND case_id = $2`, [guild, caseID]);
        return res ? new ModLog(res) : null;
    }

    static async getCaseIDs(guild: string, order: "ASC" | "DESC" = "ASC", withDeleted = false) {
        const { rows: res } = await db.query<{ case_id: number; }>(`SELECT case_id FROM ${this.TABLE} WHERE guild_id = $1${withDeleted ? "" : " AND deleted = FALSE"} ORDER BY case_id ${order}`, [guild]);
        return res.map(r => r.case_id);
    }

    static async getForGuild(guild: string, order: "ASC" | "DESC" = "ASC", withDeleted = false) {
        const { rows: res } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1${withDeleted ? "" : " AND deleted = FALSE"} ORDER BY case_id ${order}`, [guild]);
        return res.map(r => new ModLog(r));
    }

    static async getForUser(guild: string, user: string, order: "ASC" | "DESC" = "ASC", withDeleted = false) {
        const { rows: res } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND target_id = $2${withDeleted ? "" : " AND deleted = FALSE"} ORDER BY case_id ${order}`, [guild, user]);
        return res.map(r => new ModLog(r));
    }

    static async getFromMessage(guild: string, message: string) {
        const { rows: [res] } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND message_id = $2`, [guild, message]);
        return res ? new ModLog(res) : null;
    }

    static async getNextID(guild: string) {
        const { rows: [{ case_id } = { case_id: 0 }] } = await db.query<{ case_id: number; }>(`SELECT case_id FROM ${this.TABLE} WHERE guild_id = $1 ORDER BY case_id DESC LIMIT 1`, [guild]);
        return case_id + 1;
    }

    static async getWarningsForUser(guild: string, user: string, order: "ASC" | "DESC" = "ASC", withDeleted = false) {
        const { rows: res } = await db.query<ModLogData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND target_id = $2 AND type = $3${withDeleted ? "" : " AND deleted = FALSE"} ORDER BY case_id ${order}`, [guild, user, ModLogType.WARNING]);
        return res.map(r => new ModLog(r));
    }

    get typeName() {
        return Strings.ucwords(ModLogType[this.type].replace(/_/g, " "));
    }

    private load(data: ModLogData) {
        this._data         = data;
        this.amount        = data.amount;
        this.blameID       = data.blame_id;
        this.caseID        = data.case_id;
        this.channelID     = data.channel_id;
        this.createdAt     = data.created_at;
        this.deleteSeconds = data.delete_seconds;
        this.deleted       = data.deleted;
        this.guildID       = data.guild_id;
        this.messageID     = data.message_id;
        this.reason        = data.reason;
        this.reasonHidden  = data.reason_hidden;
        this.strikeID      = data.strike_id;
        this.targetID      = data.target_id;
        this.timedID       = data.timed_id;
        this.type          = data.type;
        this.updatedAt     = data.updated_at;
        this.updatedBy     = data.updated_by;
        this.warningID     = data.warning_id;
    }

    async delete() {
        return ModLog.delete(this.id);
    }

    async edit(data: ModLogUpdateData) {
        const res = await Util.genericEdit(ModLog, this.id, Util.removeUndefinedKV(data));
        if (res !== null) {
            this.load(res);
        }

        return res !== null;
    }

    async getBlame(client: MaidBoye) {
        return this.blameID === null ? null : client.getUser(this.blameID);
    }

    async getGuild(client: MaidBoye) {
        return client.guilds.get(this.guildID);
    }

    async getMessage(client: MaidBoye) {
        return this.channelID === null || this.messageID === null ? null : client.rest.channels.getMessage(this.channelID, this.messageID);
    }

    async getStrike() {
        return this.strikeID === null ? null : Strike.get(this.strikeID);
    }

    async getTarget(client: MaidBoye) {
        if (this.targetID === null) {
            return null;
        }
        switch (this.type) {
            case ModLogType.BAN:
            case ModLogType.UNBAN:
            case ModLogType.SOFTBAN:
            case ModLogType.MUTE:
            case ModLogType.UNMUTE:
            case ModLogType.KICK:
            case ModLogType.WARNING:
            case ModLogType.DELETE_WARNING:
            case ModLogType.CLEAR_WARNINGS:
            case ModLogType.STRIKE: {
                return client.getUser(this.targetID);
            }

            case ModLogType.LOCK:
            case ModLogType.UNLOCK: {
                return client.getChannel<AnyGuildTextChannel>(this.targetID);
            }

            default: {
                process.emitWarning(`unhandled getTarget type ${this.type as number} for ModLog entry ${this.id}`);
                return null;
            }
        }
    }

    async getTimed() {
        return this.timedID === null ? null : Timed.get(this.timedID);
    }

    async getUpdater(client: MaidBoye) {
        return this.updatedBy === null ? null : client.getUser(this.updatedBy);
    }

    async getWarning() {
        return this.warningID === null ? null : Warning.get(this.warningID);
    }

    shouldShowReason() {
        return this.reasonHidden === false;
    }

    shouldShowReasonFor(member: Member) {
        return this.reasonHidden === false || member.permissions.has("MANAGE_GUILD");
    }
}
