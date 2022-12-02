import db, { CountResult } from "../index.js";
import AutoPostingWebhookFailureHandler from "../../util/handlers/AutoPostingWebhookFailureHandler.js";
import Config from "../../config/index.js";
import { Colors } from "../../util/Constants.js";
import Logger from "../../util/Logger.js";
import Util from "../../util/Util.js";
import {
    AnyGuildTextChannelWithoutThreads,
    ApplicationCommandOptionsChoice,
    ApplicationCommandOptionTypes,
    Client,
    DiscordRESTError,
    ExecuteWebhookOptions,
    JSONErrorCodes
} from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import assert from "node:assert";
import { randomUUID } from "node:crypto";


export interface AutoPostingEntryData {
    channel_id: string;
    created_at: Date;
    guild_id: string;
    id: string;
    time: AutoPostingTime;
    type: AutoPostingTypes;
    updated_at: Date;
    webhook_id: string;
    webhook_token: string;
}
export type AutoPostingEntryCreationRequired = Pick<AutoPostingEntryData, "type" | "time" | "channel_id" | "webhook_id" | "webhook_token" | "guild_id">;
export type AutoPostingEntryCreationIgnored = "id" | "created_at" | "updated_at";
export type AutoPostingEntryUpdateIgnored = "id" | "created_at" | "updated_at" | "type" | "guild_id" | "time";
export type AutoPostingEntryCreationData = AutoPostingEntryCreationRequired & Partial<Omit<AutoPostingEntryData, keyof AutoPostingEntryCreationRequired | AutoPostingEntryCreationIgnored>>;
export type AutoPostingEntryUpdateData = Partial<Omit<AutoPostingEntryData, AutoPostingEntryUpdateIgnored>>;
export enum AutoPostingTypes {
    BIRB            = 1,
    BLEP            = 2,
    BUNNY           = 3,
    CAT             = 4,
    DIKDIK          = 5,
    DOG             = 6,
    DUCK            = 7,
    FOX             = 8,
    KOALA           = 9,
    OTTER           = 10,
    OWL             = 11,
    PANDA           = 12,
    SNEK            = 13,
    TURTLE          = 14,
    RED_PANDA       = 15,
    WOLF            = 16,
    BOOP            = 17,
    CUDDLE          = 18,
    FLOP            = 19,
    FURSUIT         = 20,
    HOLD            = 21,
    HOWL            = 22,
    HUG             = 23,
    KISS            = 24,
    LICK            = 25,
    BULGE_YIFF      = 26,
    ANDROMORPH_YIFF = 27,
    GAY_YIFF        = 28,
    GYNOMORPH_YIFF  = 29,
    LESBIAN_YIFF    = 30,
    STRAIGHT_YIFF   = 31
}
export const AutoPostingNSFW = [
    AutoPostingTypes.BULGE_YIFF,
    AutoPostingTypes.ANDROMORPH_YIFF,
    AutoPostingTypes.GAY_YIFF,
    AutoPostingTypes.GYNOMORPH_YIFF,
    AutoPostingTypes.LESBIAN_YIFF,
    AutoPostingTypes.STRAIGHT_YIFF
];
export const AutoPostingCategories = {
    ANIMALS:    [AutoPostingTypes.BIRB, AutoPostingTypes.BLEP, AutoPostingTypes.BUNNY, AutoPostingTypes.CAT, AutoPostingTypes.DIKDIK, AutoPostingTypes.DOG, AutoPostingTypes.DUCK, AutoPostingTypes.FOX, AutoPostingTypes.KOALA | AutoPostingTypes.OTTER, AutoPostingTypes.OWL, AutoPostingTypes.PANDA, AutoPostingTypes.SNEK, AutoPostingTypes.TURTLE, AutoPostingTypes.RED_PANDA, AutoPostingTypes.WOLF],
    FURRY:      [AutoPostingTypes.FURSUIT, AutoPostingTypes.HOLD, AutoPostingTypes.HOWL, AutoPostingTypes.HUG, AutoPostingTypes.KISS, AutoPostingTypes.LICK],
    FURRY_NSFW: AutoPostingNSFW
};
export const AutoPostingCategoryChoices: Array<ApplicationCommandOptionsChoice<ApplicationCommandOptionTypes.STRING>> = Object.keys(AutoPostingCategories).map(category => ({
    name:  category === "FURRY_NSFW" ? "Furry NSFW" : Util.readableConstant(category),
    value: category
}));
export const ValidAutoPostingTimes = [5, 10, 15, 30, 60] as const;
export type AutoPostingTime = typeof ValidAutoPostingTimes[number];
export default class AutoPostingEntry {
    static MAX_ENTRIES = 30;
    static MAX_ENTRIES_PER_TYPE = 3;
    static TABLE = "autoposting";
    _data: AutoPostingEntryData;
    channelID: string;
    createdAt: Date;
    guildID: string;
    id: string;
    time: AutoPostingTime;
    type: AutoPostingTypes;
    updatedAt: Date;
    webhook: {
        id: string;
        token: string;
    };
    constructor(data: AutoPostingEntryData) {
        assert(data && data.id, "invalid id found in AutoPostingEntry");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: AutoPostingEntryCreationData) {
        const res = await db.insert<string>(this.TABLE, { ...data, id: randomUUID() });
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new AutoPostingEntry object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<AutoPostingEntryData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new AutoPostingEntry(res) : null;
    }

    static async getAll(guild: string) {
        const { rows } = await db.query<AutoPostingEntryData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1`, [guild]);
        return rows.map(row => new AutoPostingEntry(row));
    }

    static async getCount(guild: string, type?: AutoPostingTypes) {
        const { rows: [{ count: rawCount }] } = await db.query<CountResult>(`SELECT COUNT(*) FROM ${this.TABLE} WHERE guild_id = $1${type === undefined ? "" :  " AND type = $2"}`, type === undefined ? [guild] : [guild, type]);
        return Number(rawCount);
    }

    static async getTime(time: AutoPostingEntry["time"]) {
        const { rows } = await db.query<AutoPostingEntryData>(`SELECT * FROM ${this.TABLE} WHERE time = $1`, [time]);
        return rows.map(row => new AutoPostingEntry(row));
    }

    static async getType(guild: string, type: AutoPostingTypes) {
        const { rows } = await db.query<AutoPostingEntryData>(`SELECT * FROM ${this.TABLE} WHERE guild_id = $1 AND type = $2`, [guild, type]);
        return rows.map(row => new AutoPostingEntry(row));
    }

    private load(data: AutoPostingEntryData) {
        this._data     = data;
        this.channelID = data.channel_id;
        this.createdAt = data.created_at;
        this.time      = data.time;
        this.type      = data.type;
        this.guildID   = data.guild_id;
        this.updatedAt = data.updated_at;
        this.webhook   = {
            id:    data.webhook_id,
            token: data.webhook_token
        };
    }

    async checkNSFW(client: Client, retry = false): Promise<boolean> {
        const channel = await client.rest.channels.get<AnyGuildTextChannelWithoutThreads>(this.channelID);
        if (channel === null) {
            const check = await this.checkWebhook(client);
            if (check !== null) {
                await db.query(`UPDATE ${AutoPostingEntry.TABLE} SET channel_id = $1 WHERE id = $2`, [check, this.id]);
                this.channelID = this._data.channel_id = check;
            }
            return retry ? false : this.checkNSFW(client, true);
        }
        if (channel.nsfw === false) {
            await client.rest.webhooks.execute(this.webhook.id, this.webhook.token, {
                embeds: new EmbedBuilder()
                    .setTitle("AutoPosting Disabled")
                    .setTimestamp(new Date().toISOString())
                    .setAuthor("Maid Boye", Config.botIcon)
                    .setDescription(`AutoPosting of "${Util.readableConstant(AutoPostingTypes[this.type])}" has been disabled because this channel is not NSFW.`)
                    .setColor(Colors.gold)
                    .toJSON(true)
            });
            await this.delete();
        }
        return channel.nsfw;
    }

    async checkWebhook(client: Client) {
        try {
            const webhook = await client.rest.webhooks.get(this.webhook.id, this.webhook.token);
            return webhook.channelID!;
        } catch (err) {
            await AutoPostingWebhookFailureHandler.tick(this, err instanceof DiscordRESTError && (err.code === JSONErrorCodes.UNKNOWN_WEBHOOK || err.code === JSONErrorCodes.INVALID_WEBHOOK_TOKEN));
            return null;
        }
    }

    async delete() {
        return AutoPostingEntry.delete(this.id);
    }

    async execute(client: Client, options: ExecuteWebhookOptions) {
        if (AutoPostingNSFW.includes(this.type) && !(await this.checkNSFW(client))) {
            Logger.getLogger("AutoPosting").warn(`AutoPosting of "${Util.readableConstant(AutoPostingTypes[this.type])}" has been disabled because the NSFW check failed.`);
            return null;
        }
        try {
            return (await client.rest.webhooks.execute(this.webhook.id, this.webhook.token, { ...options, wait: true })).id;
        } catch (err) {
            Logger.getLogger("AutoPostingExecution").error(`Failed to execute autoposting entry ${this.id} for guild ${this.guildID} (type: ${Util.readableConstant(AutoPostingTypes[this.type])}):`, err);
            await AutoPostingWebhookFailureHandler.tick(this, err instanceof DiscordRESTError && (err.code === JSONErrorCodes.UNKNOWN_WEBHOOK || err.code === JSONErrorCodes.INVALID_WEBHOOK_TOKEN));
            return null;
        }
    }
}
