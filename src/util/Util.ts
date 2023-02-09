import Yiffy from "./req/Yiffy.js";
import CheweyAPI from "./req/CheweyAPI.js";
import { Colors } from "./Constants.js";
import { State } from "./State.js";
import E621 from "./req/E621.js";
import type { AnyImageFormat, FailResponse, TextFormat } from "./@types/fluxpoint.js";
import type { CommandInteraction, ComponentInteraction } from "./cmd/Command.js";
import type { ExtractConstructorArg } from "./@types/misc.js";
import Logger from "./Logger.js";
import Config from "../config/index.js";
import db, { DBLiteral, DBLiteralReverse } from "../db/index.js";
import type { YiffTypes } from "../db/Models/UserConfig.js";
import type { Post } from "e621";
import {
    CategoryChannel,
    ChannelTypes,
    GuildChannel,
    StageChannel,
    ThreadChannel,
    InteractionTypes,
    ButtonStyles,
    ComponentTypes,
    Member,
    User,
    Role,
    type AuditLogActionTypes,
    type AuditLogEntry,
    type AnyChannel,
    type CreateMessageOptions,
    type EmbedOptions,
    type Uncached,
    type MessageActionRow,
    type Guild
} from "oceanic.js";
import type { ModuleImport } from "@uwu-codes/types";
import { ButtonColors, ComponentBuilder, EmbedBuilder } from "@oceanicjs/builders";
import { Strings } from "@uwu-codes/utils";
import short from "short-uuid";
import { access } from "node:fs/promises";
import { request } from "node:https";
import { AssertionError } from "node:assert";

export const expandUUID = (str: string) => short().toUUID(str);
export const shrinkUUID = (str: string) => short().fromUUID(str);
export type CompareResult = "higher" | "lower" | "same" | "invalid" | "unknown";
export default class Util {
    private static async getE621Image(tags: string, lastScoreTry = 300): Promise<Post | null> {
        const bl = ["animated", "young", "human", "humanoid", "comic", "urine", "feces", "bestiality", "vore", "inflation", "diaper"].map(b => `-${b}`).join(" ");
        const posts = await E621.posts.search({
            // the starting score is meant to be 250, but I don't want to add special handling
            tags:  `${tags} order:random score:>=${lastScoreTry - 50} ${bl} rating:e`,
            limit: 100
        });
        if (posts.length === 0) {
            if (lastScoreTry === 50) {
                return null;
            }
            try {
                return this.getE621Image(tags, lastScoreTry - 50);
            } catch (err) {
                if (err instanceof RangeError) {
                    return null;
                }
                throw err;
            }
        }

        return posts[Math.floor(Math.random() * posts.length)];
    }

    /**
     * add the specified bits if not already present
     * @param {T} current - the current bits
     * @param {...T} toAdd - the bits to add
     * @template {(bigint | number)} T
     * @returns {T}
     */
    static addBits<T extends bigint | number = bigint | number>(current: T, ...toAdd: Array<T>) {
        for (const val of toAdd) {
            current = (current | val) as T;
        }
        return current;
    }

    /** higher = from is higher than to */
    static compareMemberToMember(from: Member, to: Member | string): CompareResult {
        if (!(to instanceof Member)) {
            to = from.guild.members.get(to)!;
        }
        if (!to) {
            return "invalid";
        }
        if (from.guild.ownerID === from.id) {
            return "higher";
        }
        if (to.guild.ownerID === to.id) {
            return "lower";
        }
        const a = this.getTopRole(from)?.position ?? -1;
        const b = this.getTopRole(to)?.position ?? -1;
        if (a > b) {
            return "higher";
        } else if (a < b) {
            return "lower";
        } else if (a === b) {
            return "same";
        } else {
            return "unknown";
        }
    }

    /** higher = current member's top role is higher than compared role */
    static compareMemberToRole(from: Member, to: Role | string): CompareResult {
        if (!(to instanceof Role)) {
            to = from.guild.roles.get(to)!;
        }
        if (!to) {
            return "invalid";
        }
        if (from.guild.ownerID === to.id) {
            return "lower";
        }
        const a = this.getTopRole(from).position ?? -1;
        if (a > to.position) {
            return "higher";
        } else if (a < to.position) {
            return "lower";
        } else if (a === to.position) {
            return "same";
        } else {
            return "unknown";
        }
    }

    /** higher = current role is higher than compared member's top role */
    static compareRoleToMember(from: Role, to: Member | string): CompareResult {
        if (!(to instanceof Member)) {
            to = from.guild.members.get(to)!;
        }
        if (!to) {
            return "invalid";
        }
        if (from.guild.ownerID === to.id) {
            return "lower";
        }
        const pos = (this.getTopRole(to)?.position ?? -1);
        if (from.position > pos) {
            return "higher";
        } else if (from.position < pos) {
            return "lower";
        } else if (from.position === pos) {
            return "same";
        } else {
            return "unknown";
        }
    }

    /** higher = current role is higher than compared role */
    static compareRoleToRole(from: Role, to: Role | string): CompareResult {
        if (!(to instanceof Role)) {
            to = from.guild.roles.get(to)!;
        }
        if (!to) {
            return "invalid";
        }
        if (from.position > to.position) {
            return "higher";
        } else if (from.position < to.position) {
            return "lower";
        } else if (from.position === to.position) {
            return "same";
        } else {
            return "unknown";
        }
    }

    static ensurePresent<T extends ErrorConstructor>(condition?: unknown, message?: string, errorConstructor?: T): asserts condition {
        if (!condition) {
            throw (errorConstructor ? new errorConstructor(message) : new AssertionError({ message }));
        }
    }

    static async exists(input: string) {
        return access(input).then(() => true, () => false);
    }

    static async fluxpointGen(base: AnyImageFormat, images: Array<AnyImageFormat>, texts: Array<TextFormat>, output: "png" | "jpg" | "webp") {
        return new Promise<Buffer | FailResponse<401> | FailResponse<403> | FailResponse<500>>((resolve, reject) => {
            const req = request({
                method:   "POST",
                protocol: "https:",
                port:     443,
                hostname: "api.fluxpoint.dev",
                path:     "/gen/custom",
                headers:  {
                    "Content-Type":  "application/json",
                    "User-Agent":    Config.userAgent,
                    "Authorization": Config.fluxpointAPIKey
                }
            }, res => {
                const data: Array<Buffer> = [];

                res
                    .on("data", (d: Buffer) => data.push(d))
                    .on("error", reject)
                    .on("end", () => {
                        let j: Parameters<typeof resolve>[0];
                        try {
                            j = JSON.parse(Buffer.concat(data).toString()) as typeof j;
                        } catch {
                            j = Buffer.concat(data);
                        }

                        return resolve(j);
                    });
            });
            req.write(JSON.stringify({ base, images, texts, output }));
            req.end();
        });
    }

    static formatDiscordTime(time: Date, flag: "short-time" | "long-time" | "short-date" | "long-date" | "short-datetime" | "long-datetime" | "relative" , ms?: true): string;
    static formatDiscordTime(time: number, flag: "short-time" | "long-time" | "short-date" | "long-date" | "short-datetime" | "long-datetime" | "relative", ms?: boolean): string;
    static formatDiscordTime(time: number | Date, flag: "short-time" | "long-time" | "short-date" | "long-date" | "short-datetime" | "long-datetime" | "relative" = "short-datetime", ms = false) {
        if (time instanceof Date) {
            time = time.getTime();
            ms = true;
        }
        if (ms) {
            time = Math.floor(time / 1000);
        }
        const shortFlags = {
            "short-time":     "t",
            "long-time":      "T",
            "short-date":     "d",
            "long-date":      "D",
            "short-datetime": "f",
            "long-datetime":  "F",
            "relative":       "R"
        };
        return `<t:${time}:${shortFlags[flag]}>`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async genericEdit<C extends { TABLE: string; new(...args: Array<any>): any; }, D extends ExtractConstructorArg<C>>(clazz: C, id: number | string, data: Record<string, unknown>): Promise<D | null> {
        if (Object.hasOwn(data, "updated_at")) {
            delete data.updated_at;
        }

        const literals = Object.values(DBLiteral);
        const keys = Object.keys(data).filter(val => val !== undefined && val !== null);
        const values = Object.values(data).filter(val => val !== undefined && typeof val !== "symbol");
        let i = 1;
        let str = "";
        for (const key of keys) {
            str += typeof data[key] === "symbol" && literals.includes(data[key] as symbol) ? `${key}=${DBLiteralReverse[data[key] as symbol]}, ` : `${key}=$${++i}, `;
        }
        str += "updated_at=CURRENT_TIMESTAMP(3)";
        const query = `UPDATE ${clazz.TABLE} SET ${str} WHERE id = $1 RETURNING *`;
        try {
            const res = await db.query<D>(query, [id, ...values]);
            return res.rowCount === 0 ? null : res.rows[0] as never;
        } catch (err) {
            Logger.getLogger("GenericEdit | Error").error(`Error while updating ${clazz.TABLE} with id ${id}:`);
            Logger.getLogger("GenericEdit | Error").error(err);
            Logger.getLogger("GenericEdit | Query Input").info(data);
            Logger.getLogger("GenericEdit | Query Body").info(query);
            Logger.getLogger("GenericEdit | Query Values").info([id, ...values]);
            throw err;
        }
    }

    static getAuditLogEntry(guild: Guild, type: AuditLogActionTypes, filter: (entry: AuditLogEntry) => boolean = () => true) {
        const entry = guild.auditLogEntries.find(e => e.actionType === type && filter(e));
        if (entry) {
            Object.defineProperty(entry, "isRecent", {
                get(this: AuditLogEntry) {
                    return (Date.now() - this.createdAt.getTime()) < 5000;
                }
            });
        }
        return entry as AuditLogEntry & { readonly isRecent: boolean;} ?? null;
    }

    static getBoosterRole(guild: Guild) {
        return guild.roles.find(r => r.tags.premiumSubscriber) ?? null;
    }

    static getFlags<T extends string, N extends number | bigint>(list: Record<T, N>, flags: N, skipEnumReverseKeys = true) {
        const res = {} as Record<T, boolean>;
        for (const [key, value] of Object.entries(list) as Array<[T, N]>) {
            if (skipEnumReverseKeys && /\d/.test(key)) {
                continue;
            }
            res[key] = (flags & value) === value;
        }
        return res;
    }

    static getFlagsArray<T extends string, N extends number | bigint>(list: Record<T, N>, flags: N, skipEnumReverseKeys = true) {
        const res = [] as Array<T>;
        for (const [key, value] of Object.entries(list) as Array<[T, N]>) {
            if (skipEnumReverseKeys && /\d/.test(key)) {
                continue;
            }
            if ((flags & value) === value) {
                res.push(key);
            }
        }
        return res;
    }

    static async getImage(type: string, nsfw = false): Promise<{ source: string | null; url: string; }> {
        switch (type) {
            case "cuddle": {
                let url: string, source: string | null = null;
                if (nsfw) {
                    const post = await this.getE621Image("cuddling");
                    if (post === null) {
                        return this.getImage(type, false);
                    }
                    url = post.file.url;
                    source = `https://e621.net/posts/${post.id}`;
                } else {
                    const img = await Yiffy.images.furry.cuddle();
                    url = img.url;
                    if (img.sources.length !== 0) {
                        source = img.sources[0];
                    }
                }

                return { url, source };
            }

            case "hug": {
                let url: string, source: string | null = null;
                if (nsfw) {
                    const post = await this.getE621Image("hug");
                    if (post === null) {
                        return this.getImage(type, false);
                    }
                    url = post.file.url;
                    source = `https://e621.net/posts/${post.id}`;
                } else {
                    const img = await Yiffy.images.furry.hug();
                    url = img.url;
                    if (img.sources.length !== 0) {
                        source = img.sources[0];
                    }
                }

                return { url, source };
            }

            case "lick": {
                let url: string, source: string | null = null;
                if (nsfw) {
                    const post = await this.getE621Image("~penis_lick ~cunnilingus");
                    if (post === null) {
                        return this.getImage(type, false);
                    }
                    url = post.file.url;
                    source = `https://e621.net/posts/${post.id}`;
                } else {
                    const img = await Yiffy.images.furry.lick();
                    url = img.url;
                    if (img.sources.length !== 0) {
                        source = img.sources[0];
                    }
                }

                return { url, source };
            }

            case "kiss": {
                let url: string, source: string | null = null;
                if (nsfw) {
                    const post = await this.getE621Image("kissing");
                    if (post === null) {
                        return this.getImage(type, false);
                    }
                    url = post.file.url;
                    source = `https://e621.net/posts/${post.id}`;
                } else {
                    const img = await Yiffy.images.furry.kiss();
                    url = img.url;
                    if (img.sources.length !== 0) {
                        source = img.sources[0];
                    }
                }

                return { url, source };
            }

            default: { return { url: Config.botIcon, source: null }; }
        }
    }

    static getSourceComponent(source: string): MessageActionRow {
        return {
            type:       ComponentTypes.ACTION_ROW,
            components: [
                {
                    type:  ComponentTypes.BUTTON,
                    label: "Image Source",
                    style: ButtonStyles.LINK,
                    url:   source
                }
            ]
        };
    }

    static getTopRole(member: Member) {
        return member.roles.map(r => member.guild.roles.get(r)!).sort((a,b) => b.position - a.position)[0] ?? null;
    }

    static async getYiff(type: YiffTypes) {
        switch (type) {
            case "straight": { return Yiffy.images.furry.yiff.straight();
            }
            case "lesbian": { return Yiffy.images.furry.yiff.lesbian();
            }
            case "gynomorph": { return Yiffy.images.furry.yiff.gynomorph();
            }
            case "andromorph": { return Yiffy.images.furry.yiff.andromorph();
            }
            default: { return Yiffy.images.furry.yiff.gay();
            }
        }
    }

    static async handleGenericImage(interaction: CommandInteraction | ComponentInteraction, cmd: string) {
        const titles = {
            birb:    "Birb!",
            bunny:   "Bun-Bun!",
            cat:     "Kitty!",
            dikdik:  "Dik-Dik!",
            dog:     "Woof Woof!",
            duck:    "Quack!",
            fox:     "Screeeeee!",
            koala:   "Koala!",
            otter:   "Cuuuuute!",
            owl:     "Hoot Hoot!",
            panda:   "Panda!",
            snek:    "Snek!",
            turtle:  "Tortle",
            wah:     "Wah",
            wolf:    "Wolf!",
            fursuit: "Fursuit"
        };
        switch (cmd) {
            case "bunny": case "cat": case "dog": case "duck": case "fox": case "koala": case "otter": case "owl": case "panda": case "snek": case "turtle": case "wah": case "wolf": {
                // eslint-disable-next-line unicorn/no-nested-ternary
                const img = await CheweyAPI[cmd === "bunny" ? "rabbit" : cmd === "snek" ? "snake" : cmd === "wah" ? "redPanda" : cmd]();
                void (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.reply.bind(interaction) : interaction.editParent.bind(interaction))({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle(titles[cmd])
                        .setImage(img)
                        .setColor(Colors.gold)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>(2)
                        .addURLButton({
                            label: "Full Image",
                            url:   img
                        })
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, cmd, "new").encode(),
                            label:    "New Image",
                            style:    ButtonColors.GREY
                        })
                        .addInteractionButton({
                            customID: State.partialExit(),
                            label:    "Exit",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
                break;
            }

            case "birb": case "dikdik": case "fursuit": {
                const img = await (cmd === "birb" || cmd === "dikdik" ? Yiffy.images.animals[cmd]() : Yiffy.images.furry[cmd]());
                void (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.reply.bind(interaction) : interaction.editParent.bind(interaction))({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle(titles[cmd])
                        .setImage(img.url)
                        .setColor(Colors.gold)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>(3)
                        .addURLButton({
                            label: "Full Image",
                            url:   img.shortURL
                        })
                        .addURLButton({
                            disabled: img.sources.length === 0,
                            label:    "Source",
                            url:      img.sources[0] || "https://maid.gay"
                        })
                        .addURLButton({
                            disabled: !img.reportURL,
                            label:    "Report",
                            url:      img.reportURL || "https://report.yiff.media"
                        })
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, cmd, "new").encode(),
                            label:    "New Image",
                            style:    ButtonColors.GREY
                        })
                        .addInteractionButton({
                            customID: State.partialExit(),
                            label:    "Exit",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
                break;
            }
        }
    }

    /**
     * check if the specified bits are present
     * @param {T} current - the current bits
     * @param {...T} bits - the bits to add
     * @template {(bigint | number)} T
     * @returns {T}
     */
    static hasBits<T extends bigint | number = bigint | number>(val: T, ...bits: Array<T>) {
        return bits.every(b => (val & b) === b);
    }

    static async import<T extends object = never>(path: string, options?: ImportCallOptions) {
        const res = await import(`${path}?${Date.now()}`, options) as ModuleImport<T>;
        return "default" in res ? res.default : res;
    }

    static is<T>(param: unknown): param is T {
        return true;
    }

    static isNSFW(channel: AnyChannel | Uncached) {
        if (channel instanceof GuildChannel) {
            if (channel instanceof CategoryChannel || channel instanceof StageChannel) {
                return false;
            }
            return channel instanceof ThreadChannel ? channel.parent?.nsfw ?? false : channel.nsfw;
        } else {
            if (!("type" in channel) || channel.type === ChannelTypes.DM) {
                return true;
            } else if (channel.type === ChannelTypes.GROUP_DM) {
                return false;
            } else {
                return false;
            }
        }
    }

    static makeEmbed(defaults?: boolean, author?: User | Member, json?: EmbedOptions) {
        const embed = json ? EmbedBuilder.loadFromJSON(json) : new EmbedBuilder();
        if (defaults) {
            embed.setColor(Colors.bot).setTimestamp("now").setFooter("UwU", Config.botIcon);
        }
        if (author && author instanceof User || author instanceof Member) {
            embed.setAuthor(author.tag, author.avatarURL());
        }
        return embed;
    }

    static readableConstant(str: string) {
        return Strings.ucwords(str.toLowerCase().replace(/_/g, " "));
    }

    /**
     * remove the specified bits if present
     * @param {T} current - the current bits
     * @param {...T} toRemove - the bits to add
     * @template {(bigint | number)} T
     * @returns {T}
     */
    static removeBits<T extends bigint | number = bigint | number>(current: T, ...toRemove: Array<T>) {
        if (Array.isArray(toRemove)) {
            for (const val of toRemove) {
                current = (current & ~val) as T;
            }
        }
        return current;
    }

    static removeUndefinedKV<T extends Record<string, unknown>>(data: T) {
        return Object.entries(data).filter(([key, value]) => key !== undefined && key !== null && value !== undefined).map(([key, value]) => ({ [key]: value })).reduce((a, b) => ({ ...a, ...b }), {}) as T;
    }

    /**
     * Replaces all normally provided things with empty versions
     * @param {CreateMessageOptions} newContent - the new content
     * @returns {CreateMessageOptions}
     */
    static replaceContent(newContent: CreateMessageOptions) {
        return {
            components: [],
            content:    "",
            embeds:     [],
            stickerIDs: [],
            ...newContent
        };
    }

    static reverseObject<A extends string | number | symbol, B extends string | number | symbol>(obj: Record<A, B>) {
        return Object.keys(obj).map(key => ({
            [obj[key as A]]: key
        })).reduce((a, b) => ({ ...a, ...b })) as Record<B, A>;
    }
}
