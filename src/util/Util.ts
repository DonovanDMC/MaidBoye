import Yiffy from "./req/Yiffy.js";
import CheweyAPI from "./req/CheweyAPI.js";
import { Colors } from "./Constants.js";
import { State } from "./State.js";
import E621 from "./req/E621.js";
import type { AnyImageFormat, FailResponse, TextFormat } from "./@types/fluxpoint.js";
import type { CommandInteraction, ComponentInteraction } from "./cmd/Command.js";
import type { ExtractConstructorArg } from "./@types/misc.js";
import { GuildMemberFlagNames, UserFlagNames } from "./Names.js";
import Command from "./cmd/Command.js";
import type { TypeToClass } from "./cmd/Category.js";
import { getClient } from "./ClientInstanceHelper.js";
import Config from "../config/index.js";
import db, { DBLiteral, DBLiteralReverse } from "../db/index.js";
import type { YiffTypes } from "../db/Models/UserConfig.js";
import UserConfig from "../db/Models/UserConfig.js";
import Logger from "@uwu-codes/logger";
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
    type Guild,
    UserFlags,
    GuildMemberFlags,
    ApplicationCommandTypes
} from "oceanic.js";
import type { ModuleImport } from "@uwu-codes/types";
import { ButtonColors, ComponentBuilder, EmbedBuilder } from "@oceanicjs/builders";
import { Strings } from "@uwu-codes/utils";
import short from "short-uuid";
import type { NextFunction, Request, Response } from "express";
import { access } from "node:fs/promises";
import { request } from "node:https";
import { AssertionError } from "node:assert";

export const expandUUID = (str: string) => short().toUUID(str);
export const shrinkUUID = (str: string) => short().fromUUID(str);
export type CompareResult = "higher" | "lower" | "same" | "invalid" | "unknown";
export default class Util {
    private static async getE621Image(tags: string, minScore = 250): Promise<Post | null> {
        const bl = ["animated", "young", "human", "humanoid", "comic", "urine", "feces", "bestiality", "vore", "inflation", "diaper"].map(b => `-${b}`).join(" ");
        const posts = await E621.posts.search({
            tags:  `${tags} order:random score:>=${minScore} ${bl} rating:e`,
            limit: 100
        }).catch(() => null);
        if (posts === null) {
            return null;
        }
        if (posts.length === 0) {
            if (minScore === 0) {
                return null;
            }
            try {
                return this.getE621Image(tags, minScore - 50);
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
     *
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

    static apiAuth() {
        return (async(req: Request, res: Response, next: NextFunction) => {
            if (!req.headers.authorization || !req.headers.authorization.startsWith("Basic ")) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const [id, apikey] = Buffer.from(req.headers.authorization.slice(6), "base64").toString("ascii").split(":");

            if (!id || !apikey) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const user = await UserConfig.getByIDAndAPIKey(id, apikey).catch(() => null);
            if (user) {
                req.data.uConfig = user;
                const usr = await getClient().getUser(user.id);
                Logger.getLogger("api").info(`API request from ${usr?.tag ?? "unknown"} (${user.id}) for ${req.method} ${req.path}`);
                next();
            } else {
                res.status(401).json({ error: "Unauthorized" });
            }
        });
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

    static formatBadges(user: User | Member) {
        const flags = Util.getFlagsArray(UserFlags, user.publicFlags);
        const names = flags.map(f => `${Config.emojis.default.dot} ${UserFlagNames[UserFlags[f]]}`);
        if (user.id === "242843345402069002") {
            names.push(`${Config.emojis.default.dot} ${Config.emojis.custom.don} MaidBoye Developer`);
        }

        return names.join("\n");
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

    static formatFlags(member: Member) {
        const guildFlags = Util.getFlagsArray(GuildMemberFlags, member.flags);
        return guildFlags.map(f => `${Config.emojis.default.dot} ${GuildMemberFlagNames[GuildMemberFlags[f]]}`).join("\n");
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

    static genericImageCommandExpander<T extends ApplicationCommandTypes>(this: void, type: T, file: string, name: string): TypeToClass<T> {
        switch (type) {
            case ApplicationCommandTypes.CHAT_INPUT: {
                return new Command(file, name)
                    .setCooldown(1e4)
                    .setAck("ephemeral-user")
                    .setExecutor(async function(interaction) {
                        return Util.handleGenericImage(interaction, name);
                    }) as never;
            }

            default: {
                throw new Error(`Invalid command type ${ApplicationCommandTypes[type] || type} @${file}:${name}`);
            }
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
            if (skipEnumReverseKeys && !isNaN(Number(key))) {
                continue;
            }
            res[key] = (flags & value) === value;
        }
        return res;
    }

    static getFlagsArray<T extends string, N extends number | bigint>(list: Record<T, N>, flags: N, skipEnumReverseKeys = true) {
        const res = [] as Array<T>;
        for (const [key, value] of Object.entries(list) as Array<[T, N]>) {
            if (skipEnumReverseKeys && !isNaN(Number(key))) {
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
            case "straight": return Yiffy.images.furry.yiff.straight();
            case "lesbian": return Yiffy.images.furry.yiff.lesbian();
            case "gynomorph": return Yiffy.images.furry.yiff.gynomorph();
            case "andromorph": return Yiffy.images.furry.yiff.andromorph();
            default: return Yiffy.images.furry.yiff.gay();
        }
    }

    static async handleGenericImage(interaction: CommandInteraction | ComponentInteraction, cmd: string) {
        const map = {
            "birb":            { d: true as const, f: Yiffy.images.animals.birb, t: "Birb!" },
            "bunny":           { d: false as const, f: CheweyAPI.images.rabbit, t: "Bun-Bun!" },
            "cat":             { d: false as const, f: CheweyAPI.images.cat, t: "kitty!" },
            "dikdik":          { d: true as const, f: Yiffy.images.animals.dikdik, t: "Dik-Dik!" },
            "dog":             { d: false as const, f: CheweyAPI.images.dog, t: "Wool Woof!" },
            "duck":            { d: false as const, f: CheweyAPI.images.duck, t: "Quack!" },
            "fox":             { d: false as const, f: CheweyAPI.images.fox, t: "Screeeeee!" },
            "koala":           { d: false as const, f: CheweyAPI.images.koala, t: "Koala!" },
            "otter":           { d: false as const, f: CheweyAPI.images.otter, t: "Cuuuuute!" },
            "owl":             { d: false as const, f: CheweyAPI.images.owl, t: "Hoot Hoot!" },
            "panda":           { d: false as const, f: CheweyAPI.images.panda, t: "Panda!" },
            "snek":            { d: false as const, f: CheweyAPI.images.snake, t: "Snek!" },
            "turtle":          { d: false as const, f: CheweyAPI.images.turtle, t: "Tortle!" },
            "wah":             { d: false as const, f: CheweyAPI.images["red-panda"], t: "Wah!" },
            "wolf":            { d: false as const, f: CheweyAPI.images.wolf, t: "Wolf!" },
            "fursuit":         { d: true as const, f: Yiffy.images.furry.fursuit, t: "Fursuit!" },
            "fursuitbutt":     { d: true as const, f: Yiffy.images.furry.butts, t: "Fursuit Butt!" },
            "bulge":           { d: true as const, f: Yiffy.images.furry.bulge, t: "Bulge!" },
            "yiff.gay":        { d: true as const, f: Yiffy.images.furry.yiff.gay, t: "Gay Yiff!" },
            "yiff.straight":   { d: true as const, f: Yiffy.images.furry.yiff.straight, t: "Straight Yiff!" },
            "yiff.lesbian":    { d: true as const, f: Yiffy.images.furry.yiff.lesbian, t: "Lesbian Yiff!" },
            "yiff.gynomorph":  { d: true as const, f: Yiffy.images.furry.yiff.gynomorph, t: "Gynomorph Yiff!" },
            "yiff.andromorph": { d: true as const, f: Yiffy.images.furry.yiff.andromorph, t: "Andromorph Yiff!" }
        };
        if (!(cmd in map)) {
            if (cmd.startsWith("yiff.")) {
                cmd = "yiff.gay";
            } else {
                void interaction.reply({
                    content: `S-ssomething broke.. Please report this to a developer.\n\nExtra info: \`cmd=${cmd}\``
                });
                return;
            }
        }
        const c = map[cmd as keyof typeof map];
        let url: string, linkURL: string, source: string | undefined;
        if (c.d) {
            const img = await c.f();
            url = img.url;
            linkURL = img.shortURL;
            source = img.sources[0];
        } else {
            const img = await c.f();
            url = linkURL = img;
        }
        void (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.reply.bind(interaction) : interaction.editParent.bind(interaction))({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(c.t)
                .setImage(url)
                .setColor(Colors.gold)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(3)
                .addURLButton({
                    label: "Full Image",
                    url:   linkURL
                })
                .addURLButton({
                    disabled: source === undefined,
                    label:    "Source",
                    url:      source || "https://maidboye.cafe"
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "generic-image", "new").with("type", cmd).encode(),
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
    }

    /**
     * check if the specified bits are present
     *
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
        return Strings.ucwords(str.toLowerCase().replaceAll("_", " "));
    }

    /**
     * remove the specified bits if present
     *
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
     *
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
