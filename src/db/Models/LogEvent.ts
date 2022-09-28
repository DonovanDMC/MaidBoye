import db, { CountResult } from "../index.js";
import type MaidBoye from "../../main.js";
import LoggingWebhookFailureHandler from "../../util/handlers/LoggingWebhookFailureHandler.js";
import { assert } from "tsafe";
import {
    ApplicationCommandOptionsChoice,
    ApplicationCommandOptionTypes,
    DiscordRESTError,
    ExecuteWebhookOptions,
    JsonErrorCodes
} from "oceanic.js";
import chunk from "chunk";
import { Strings } from "@uwu-codes/utils";
import { randomUUID } from "crypto";


export interface LogEventData {
    channel_id: string;
    created_at: Date;
    event: LogEvents;
    guild_id: string;
    id: string;
    updated_at: Date;
    webhook_id: string;
    webhook_token: string;
}
export type LogEventCreationRequired = Pick<LogEventData, "event" | "channel_id" | "webhook_id" | "webhook_token" | "guild_id">;
export type LogEventCreationIgnored = "id" | "created_at" | "updated_at";
export type LogEventUpdateIgnored = "id" | "created_at" | "updated_at" | "event" | "guild_id";
export type LogEventCreationData = LogEventCreationRequired & Partial<Omit<LogEventData, keyof LogEventCreationRequired | LogEventCreationIgnored>>;
export type LogEventUpdateData = Partial<Omit<LogEventData, LogEventUpdateIgnored>>;
export enum LogEvents {
    ALL                         = 0,
    AUTOMOD_ACTION_EXECUTION    = 1,
    AUTOMOD_RULE_CREATE         = 2,
    AUTOMOD_RULE_DELETE         = 3,
    AUTOMOD_RULE_UPDATE         = 4,
    BAN_ADD                     = 5,
    BAN_REMOVE                  = 6,
    CHANNEL_CREATE              = 7,
    CHANNEL_DELETE              = 8,
    CHANNEL_UPDATE              = 9,
    EMOJI_CREATE                = 10,
    EMOJI_DELETE                = 11,
    EMOJI_UPDATE                = 12,
    GUILD_UPDATE                = 13,
    INTEGRATION_CREATE          = 14,
    INTEGRATION_DELETE          = 15,
    INTEGRATION_UPDATE          = 16,
    INVITE_CREATE               = 17,
    INVITE_DELETE               = 18,
    MEMBER_ADD                  = 19,
    MEMBER_KICK                 = 20,
    MEMBER_REMOVE               = 21,
    MEMBER_UPDATE               = 22,
    MESSAGE_DELETE              = 23,
    MESSAGE_DELETE_BULK         = 24,
    MESSAGE_UPDATE              = 25,
    ROLE_CREATE                 = 26,
    ROLE_DELETE                 = 27,
    ROLE_UPDATE                 = 28,
    SCHEDULED_EVENT_CREATE      = 29,
    SCHEDULED_EVENT_DELETE      = 30,
    SCHEDULED_EVENT_UPDATE      = 31,
    SCHEDULED_EVENT_USER_ADD    = 32,
    SCHEDULED_EVENT_USER_REMOVE = 33,
    STAGE_INSTANCE_CREATE       = 34,
    STAGE_INSTANCE_DELETE       = 35,
    STAGE_INSTANCE_UPDATE       = 36,
    STICKER_CREATE              = 37,
    STICKER_DELETE              = 38,
    STICKER_UPDATE              = 39,
    THREAD_CREATE               = 40,
    THREAD_DELETE               = 41,
    THREAD_MEMBER_ADD           = 42,
    THREAD_MEMBER_REMOVE        = 43,
    THREAD_UPDATE               = 44,
    USER_UPDATE                 = 45,
    VOICE_JOIN                  = 46,
    VOICE_LEAVE                 = 47,
    VOICE_STATE_UPDATE          = 48,
}
export const LogEventsTotal = Object.keys(LogEvents).length / 2;
export const LogEventsAllValue = LogEventsTotal - 1;

export const LogCategories = {
    AUTOMOD:          [LogEvents.AUTOMOD_ACTION_EXECUTION, LogEvents.AUTOMOD_RULE_CREATE, LogEvents.AUTOMOD_RULE_DELETE, LogEvents.AUTOMOD_RULE_UPDATE],
    BANS:             [LogEvents.BAN_ADD, LogEvents.BAN_REMOVE],
    CHANNELS:         [LogEvents.CHANNEL_CREATE, LogEvents.CHANNEL_DELETE, LogEvents.CHANNEL_UPDATE],
    EMOJIS:           [LogEvents.EMOJI_CREATE, LogEvents.EMOJI_DELETE, LogEvents.EMOJI_UPDATE],
    INTEGRATIONS:     [LogEvents.INTEGRATION_CREATE, LogEvents.INTEGRATION_DELETE, LogEvents.INTEGRATION_UPDATE],
    INVITES:          [LogEvents.INVITE_CREATE, LogEvents.INVITE_DELETE],
    MEMBERS:          [LogEvents.MEMBER_ADD, LogEvents.MEMBER_REMOVE, LogEvents.MEMBER_KICK, LogEvents.MEMBER_UPDATE],
    MESSAGES:         [LogEvents.MESSAGE_DELETE, LogEvents.MESSAGE_DELETE_BULK, LogEvents.MESSAGE_UPDATE],
    MISC:             [LogEvents.ALL, LogEvents.GUILD_UPDATE, LogEvents.USER_UPDATE],
    ROLES:            [LogEvents.ROLE_CREATE, LogEvents.ROLE_DELETE, LogEvents.ROLE_UPDATE],
    SCHEDULED_EVENTS: [LogEvents.SCHEDULED_EVENT_CREATE, LogEvents.SCHEDULED_EVENT_DELETE, LogEvents.SCHEDULED_EVENT_UPDATE, LogEvents.SCHEDULED_EVENT_USER_ADD, LogEvents.SCHEDULED_EVENT_USER_REMOVE],
    STAGE_INSTANCES:  [LogEvents.STAGE_INSTANCE_CREATE, LogEvents.STAGE_INSTANCE_DELETE, LogEvents.STAGE_INSTANCE_UPDATE],
    STICKERS:         [LogEvents.STICKER_CREATE, LogEvents.STICKER_DELETE, LogEvents.STICKER_UPDATE],
    THREADS:          [LogEvents.THREAD_CREATE, LogEvents.THREAD_DELETE, LogEvents.THREAD_UPDATE, LogEvents.THREAD_MEMBER_ADD, LogEvents.THREAD_MEMBER_REMOVE],
    VOICE:            [LogEvents.VOICE_JOIN, LogEvents.VOICE_LEAVE, LogEvents.VOICE_STATE_UPDATE]
};

export const LogCategoriesChoices: Array<ApplicationCommandOptionsChoice<ApplicationCommandOptionTypes.STRING>> = Object.keys(LogCategories).map(category => ({
    name:  Strings.ucwords(category.toLowerCase().replace(/_/g, " ")),
    value: category
}));

export default class LogEvent {
    static MAX_EVENTS = 100;
    static MAX_EVENTS_PER_TYPE = 5;
    static TABLE = "logevents";
    _data: LogEventData;
    channelID: string;
    createdAt: Date;
    event: LogEvents;
    guildID: string;
    id: string;
    updatedAt: Date;
    webhook: {
        id: string;
        token: string;
    };
    constructor(data: LogEventData) {
        assert(data && data.id, "invalid id found in Stat");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: LogEventCreationData) {
        const res = await db.insert<string>(this.TABLE, { ...data, id: randomUUID() });
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new LogEvent object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<LogEventData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return !res ? null : new LogEvent(res);
    }

    static async getAll(guild: string) {
        const { rows } = await db.query<LogEventData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1`, [guild]);
        return rows.map(row => new LogEvent(row));
    }

    static async getCount(guild: string, type?: LogEvents) {
        const { rows: [{ count: rawCount }] } = await db.query<CountResult>(`SELECT COUNT(*) FROM ${this.TABLE} WHERE guild_id = $1${type === undefined ? "" :  " AND event = $2"}`, type === undefined ? [guild] : [guild, type]);
        let count = Number(rawCount);
        if (type === undefined) {
            const all = await this.getCount(guild, LogEvents.ALL);
            count += (LogEventsAllValue - 1) * all;
        }
        return count;
    }

    static async getType(guild: string, type: LogEvents) {
        const { rows } = await db.query<LogEventData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND (event = $2 OR event = $3)`, [guild, type, LogEvents.ALL]);
        return rows.map(row => new LogEvent(row));
    }

    private load(data: LogEventData) {
        this._data       = data;
        this.channelID = data.channel_id;
        this.createdAt = data.created_at;
        this.event     = data.event;
        this.guildID   = data.guild_id;
        this.updatedAt = data.updated_at;
        this.webhook   = {
            id:    data.webhook_id,
            token: data.webhook_token
        };
    }

    async delete() {
        return LogEvent.delete(this.id);
    }

    async execute(client: MaidBoye, options: ExecuteWebhookOptions) {
        try {
            if (options.embeds && options.embeds.length > 10) {
                const parts = chunk(options.embeds, 10);
                for (const part of parts) {
                    await this.execute(client, { ...options, embeds: part });
                }
                return;
            }
            await client.rest.webhooks.execute(this.webhook.id, this.webhook.token, options);
        } catch (err) {
            console.log(err instanceof DiscordRESTError && (err.code === JsonErrorCodes.UNKNOWN_WEBHOOK || err.code === JsonErrorCodes.INVALID_WEBHOOK_TOKEN));
            await LoggingWebhookFailureHandler.tick(this, err instanceof DiscordRESTError && (err.code === JsonErrorCodes.UNKNOWN_WEBHOOK || err.code === JsonErrorCodes.INVALID_WEBHOOK_TOKEN));
        }
    }
}
