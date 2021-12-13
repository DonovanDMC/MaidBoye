import EmbedBuilder from "./EmbedBuilder";
import type ExtendedMessage from "./ExtendedMessage";
import type { BitData } from "./@types/MariaDB";
import type Command from "@cmd/Command";
import TempFiles from "@handlers/TempFiles";
import Yiffy from "@req/Yiffy";
import CommandError from "@cmd/CommandError";
import type { AntiSpamEntry } from "@cmd/AntiSpam";
import GuildConfig from "@models/Guild/GuildConfig";
import type { GuildAuditLogEntry } from "eris";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import type MaidBoye from "@MaidBoye";
import {
	antiSpamDir,
	apiURL,
	beta,
	emojis,
	levelingFlatRate,
	levelingFlatRateStart,
	levelingStartRate,
	lbPerPage
} from "@config";
import * as fs from "fs-extra";
import db from "@db";
const Redis = db.r;
import type { RawLevel } from "@models/User/UserConfig";
import crypto from "crypto";

// since a lot of the fun commands are generic, we have to do this
const funCommandResponses = (msg: ExtendedMessage) => ({
	bap: [
		`<@!${msg.author.id}> smacks ${BotFunctions.extraArgParsing(msg)} hard on the snoot with a rolled up news paper!`,
		`<@!${msg.author.id}> goes to smack ${BotFunctions.extraArgParsing(msg)} on the snoot with a news paper, but missed and hit themself!`
	],
	bellyrub: [
		`<@!${msg.author.id}> rubs the belly of ${BotFunctions.extraArgParsing(msg)}!`
	],
	blep: [
		`<@!${msg.author.id}> did a little blep!`,
		`<@!${msg.author.id}> stuck their tongue out cutely!`
	],
	boop: [
		`<@!${msg.author.id}> has booped ${BotFunctions.extraArgParsing(msg)}!\nOwO`,
		`<@!${msg.author.id}> lightly pokes the nose of ${BotFunctions.extraArgParsing(msg)}\nOwO`
	],
	cuddle: [
		`<@!${msg.author.id}> has cuddled ${BotFunctions.extraArgParsing(msg)}!\nAren't they cute?`,
		`<@!${msg.author.id}> sneaks up behind ${BotFunctions.extraArgParsing(msg)}, and cuddles them\nIsn't that sweet?`
	],
	dictionary: [
		`<@!${msg.author.id}> throws a dictionary at ${BotFunctions.extraArgParsing(msg)} screaming "KNOWLEDGE"!`,
		`<@!${msg.author.id}> drops some knowledge on ${BotFunctions.extraArgParsing(msg)}, with their dictionary!`,
		`<@!${msg.author.id}> drops their entire English folder onto ${BotFunctions.extraArgParsing(msg)}, it seems to have flattened them!`
	],
	flop: [
		`<@!${msg.author.id}> flops over onto ${BotFunctions.extraArgParsing(msg)}\nuwu`,
		`<@!${msg.author.id}> lays on ${BotFunctions.extraArgParsing(msg)}.. owo`
	],
	glomp: [
		`<@!${msg.author.id}> pounces on ${BotFunctions.extraArgParsing(msg)}, tackling them to the floor in a giant hug!`
	],
	huff: [
		`<@!${msg.author.id}> huffed, and puffed, and blew ${BotFunctions.extraArgParsing(msg)}'s house down!`
	],
	hug: [
		`<@!${msg.author.id}> sneaks up being ${BotFunctions.extraArgParsing(msg)}, and when they aren't looking, tackles them from behind in the biggest hug ever!`,
		`<@!${msg.author.id}> gently wraps their arms around ${BotFunctions.extraArgParsing(msg)}, giving them a big warm hug!`
	],
	kiss: [
		`<@!${msg.author.id}> kisses ${BotFunctions.extraArgParsing(msg)}, how cute!`
	],
	lick: [
		`<@!${msg.author.id}> licks ${BotFunctions.extraArgParsing(msg)}\nUwU`,
		`<@!${msg.author.id}> decides to make ${BotFunctions.extraArgParsing(msg)}'s fur a little slimy...`
	],
	nap: [
		`<@!${msg.author.id}> decided to take a nap on ${BotFunctions.extraArgParsing(msg)}.. ${BotFunctions.extraArgParsing(msg)} might need a forklift for this one!`
	],
	nuzzle: [
		`<@!${msg.author.id}> nuzzles ${BotFunctions.extraArgParsing(msg)} gently`
	],
	pat: [
		`<@!${msg.author.id}> pats ${BotFunctions.extraArgParsing(msg)} on the head for being a good boi`,
		`<@!${msg.author.id}> gently pats ${BotFunctions.extraArgParsing(msg)}`
	],
	poke: [
		`<@!${msg.author.id}> pokes ${BotFunctions.extraArgParsing(msg)}\nDon't make them mad..`
	],
	pounce: [
		`<@!${msg.author.id}> pounces onto ${BotFunctions.extraArgParsing(msg)} uwu`
	],
	sniff: [
		// rip siff
		`<@!${msg.author.id}> sniffs ${BotFunctions.extraArgParsing(msg)}\nMaybe they smell good..?`
	],
	slap: [
		`<@!${msg.author.id}> slaps ${BotFunctions.extraArgParsing(msg)}.. ouch`
	],
	snowball: [
		`<@!${msg.author.id}> throws a snowball at ${BotFunctions.extraArgParsing(msg)}!`
	],
	spray: [
		`<@!${msg.author.id}> sprays ${BotFunctions.extraArgParsing(msg)} with a bottle of water, while yelling "bad fur"!`
	],
	wag: [
		`<@!${msg.author.id}> wags their little tail, aren't they cute ^w^`
	]
});

export default class BotFunctions {
	private constructor() {
		throw new TypeError("This class may not be instantiated, use static methods.");
	}

	static messageToOriginal(message: Eris.Message): Record<string, unknown> & { id: string; } {
		return {
			id: message.id,
			channel_id: message.channel.id,
			guild_id: "guild" in message.channel ? message.channel.guild.id : undefined,
			author: {
				...message.author.toJSON(),
				public_flags: message.author.publicFlags
			},
			member: {
				...message.member,
				user: {
					...message.author.toJSON(),
					public_flags: message.author.publicFlags
				},
				joined_at: !message.member || message.member.joinedAt === null ? undefined : new Date(message.member.joinedAt).toISOString(),
				premium_since: message.member?.premiumSince,
				deaf: !!message.member?.voiceState.deaf,
				mute: !!message.member?.voiceState.mute,
				pending: message.member?.pending
			},
			content: message.content,
			timestamp: new Date(message.timestamp).toISOString(),
			edited_timestamp: message.editedTimestamp === undefined ? undefined : new Date(message.editedTimestamp ?? 0).toISOString(),
			tts: !!message.tts,
			mention_everyone: message.mentionEveryone,
			mentions: message.mentions.map(m => ({
				...m.toJSON(),
				public_flags: m.publicFlags,
				// I don't know what this is supposed to have, as the docs don't make
				// a distinction between normal members and partial members
				member: {
					...m,
					user: {
						...message.author.toJSON(),
						public_flags: message.author.publicFlags
					},
					joined_at: new Date(message.member?.joinedAt ?? 0).toISOString(),
					premium_since: message.member?.premiumSince,
					deaf: !!message.member?.voiceState.deaf,
					mute: !!message.member?.voiceState.mute,
					pending: message.member?.pending
				}
			})),
			mention_roles: message.roleMentions,
			mention_channels: message.channelMentions,
			attachments: message.attachments,
			embeds: message.embeds,
			reactions: Object.entries(message.reactions).map(([k, v]) => ({
				count: v.count,
				me: v.me,
				emoji: k.includes(":") ? {
					id: null,
					name: k
				} : {
					id: k.split(":")[0],
					name: k.split(":")[1]
				}
			})),
			pinned: !!message.pinned,
			webhook_id: message.webhookID,
			type: message.type,
			activity: message.activity,
			application: message.application,
			application_id: message.application?.id,
			message_reference: message.messageReference === null ? undefined : {
				message_id: message.messageReference.messageID,
				channel_id: message.messageReference.channelID,
				guild_id: message.messageReference.guildID
			},
			flags: message.flags,
			// eslint-disable-next-line deprecation/deprecation
			stickers: message.stickers,
			sticker_items: message.stickerItems,
			referenced_message: message.referencedMessage === undefined ? undefined : message.referencedMessage === null ? null : this.messageToOriginal(message.referencedMessage),
			interaction: null,
			components: message.components
		};
	}

	static formatPrefix(p: GuildConfig | GuildConfig["prefix"] | GuildConfig["prefix"][number]) {
		if (p instanceof GuildConfig) p = p.prefix[0];
		if (Array.isArray(p)) p = p[0];
		return `${p.value}${p.space ? " " : ""}`;
	}

	static getUserFlags(user: Eris.User) {
		const removedFlags = [
			"NONE",
			"DISCORD_EMPLOYEE",                                       // DISCORD_STAFF
			"PARTNERED_SERVER_OWNER", "DISCORD_PARTNER",              // PARTNER
			"HYPESQUAD_EVENTS",                                       // HYPESQUAD
			"HYPESQUAD_ONLINE_HOUSE_1",                               // HOUSE_BRAVERY
			"HYPESQUAD_ONLINE_HOUSE_2",                               // HOUSE_BRILLIANCE
			"HYPESQUAD_ONLINE_HOUSE_3",                               // HOUSE_BALANCE
			"EARLY_SUPPORTER",                                        // PREMIUM_EARLY_SUPPORTER
			"TEAM_USER",                                              // TEAM_PSUEDO_USER
			"EARLY_VERIFIED_BOT_DEVELOPER", "VERIFIED_BOT_DEVELOPER", // VERIFIED_DEVELOPER
			"DISCORD_CERTIFIED_MODERATOR"                             // CERTIFIED_MODERATOR
		] as const;
		return Object.entries(Eris.Constants.UserFlags).filter(([f]) => !removedFlags.includes(f as (typeof removedFlags)[number])).map(([f, v]) => ({
			[f]: ((user.publicFlags ?? 0) & v) === v
		})).reduce((a, b) => ({ ...a, ...b }), {}) as {
			[K in Exclude<keyof typeof Eris.Constants.UserFlags, (typeof removedFlags)[number]>]: boolean;
		};
	}

	static getUserFlagsArray(user: Eris.User) {
		return Object.entries(this.getUserFlags(user)).filter(([, b]) => b === true).map(([a]) => a) as Array<keyof ReturnType<typeof BotFunctions["getUserFlags"]>>;
	}

	static getMessageFlags(msg: Eris.Message | number) {
		return Object.entries(Eris.Constants.MessageFlags).map(([f, v]) => ({
			[f]: (((typeof msg === "number" ? msg : msg.flags) ?? 0) & v) === v
		})).reduce((a, b) => ({ ...a, ...b }), {}) as {
			[K in keyof typeof Eris.Constants.MessageFlags]: boolean;
		};
	}

	static getSystemChannelFlags(flags: number) {
		return Object.entries(Eris.Constants.SystemChannelFlags).map(([f, v]) => ({
			[f]: ((flags ?? 0) & v) === v
		})).reduce((a, b) => ({ ...a, ...b }), {}) as {
			[K in keyof typeof Eris.Constants.SystemChannelFlags]: boolean;
		};
	}

	static formatDiscordTime(time: number, flag: "short-time" | "long-time" | "short-date" | "long-date" | "short-datetime" | "long-datetime" | "relative" = "short-datetime", ms = false) {
		if (ms) time = Math.floor(time / 1000);
		return `<t:${time}:${flag === "short-time" ? "t" :
			flag === "long-time" ? "T" :
				flag === "short-date" ? "d" :
					flag === "long-date" ? "D" :
						flag === "short-datetime" ? "f" :
							flag === "long-datetime" ? "F" :
								flag === "relative" ? "R" :
									"f"}>`;
	}

	// @FIXME legacy code
	static genErrorEmbed(user: Eris.User | null, type: "INVALID_USER" | "INVALID_MEMBER" | "INVALID_ROLE" | "INVALID_CHANNEL", json: true): Eris.EmbedOptions;
	static genErrorEmbed(user: Eris.User | null, type: "INVALID_USER" | "INVALID_MEMBER" | "INVALID_ROLE" | "INVALID_CHANNEL", json?: false): EmbedBuilder;
	static genErrorEmbed(user: Eris.User | null, type: "INVALID_USER" | "INVALID_MEMBER" | "INVALID_ROLE" | "INVALID_CHANNEL", json?: boolean) {
		const desc = {
			INVALID_USER: "The specified user was not found. Please provide either a mention, a username, a full tag, or an id.",
			INVALID_MEMBER: "The specified member was not found. Please provide either a mention, a username, a full tag, or an id.",
			INVALID_ROLE: "The specified role was not found. Please provide either a mention, a name, or an id.",
			INVALID_CHANNEL: "The specified channel was not found. Please provide either a mention, a name, or an id."
		};
		const e = new EmbedBuilder(true, user)
			.setTitle(`${Strings.ucwords(type.split("_")[1].toLowerCase())} Not Found`)
			.setDescription(desc[type])
			.setTimestamp(new Date().toISOString())
			.setColor("red");
		return json ? e.toJSON() : e;
	}

	static sqlFormat(v: unknown) {
		if (typeof v === "string") return `'${v}'`;
		else if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
		else if (v === null) return "NULL";
		else return String(v);
	}

	static async genericFunCommand(this: MaidBoye, msg: ExtendedMessage, cmd: Command) {
		if (!["wag"].some(v => cmd.triggers.includes(v)) && msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const r = funCommandResponses(msg)[cmd.triggers[0] as "hug"];

		const embed = new EmbedBuilder(true, msg.author)
			.setAuthor(msg.author.tag, msg.author.avatarURL)
			.setDescription(!r ? "Failed To Look Up Language String " : r[Math.floor(Math.random() * r.length)])
			.setTimestamp(new Date().toISOString());

		if (cmd.triggers.includes("bap")) embed.setImage("https://assets.maid.gay/bap.gif");
		if (cmd.triggers.includes("bellyrub")) embed.setImage("https://assets.maid.gay/bellyrub.gif");
		if (cmd.triggers.includes("spray")) embed.setDescription(`${embed.getDescription()!}\n${emojis.custom.spray.repeat(Math.floor(Math.random() * 3) + 2)}`);

		return msg.channel.createMessage({
			embeds: [
				embed.toJSON()
			]
		});
	}

	static async genericFunCommandWithImage(this: MaidBoye, msg: ExtendedMessage, cmd: Command, type: keyof typeof Yiffy["furry"] | "blep") {
		if (![].some(v => cmd.triggers.includes(v)) && msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const r = funCommandResponses(msg)[cmd.triggers[0] as "hug"];

		const embed = new EmbedBuilder(true, msg.author)
			.setAuthor(msg.author.tag, msg.author.avatarURL)
			.setDescription(!r ? "Failed To Look Up Language String " : r[Math.floor(Math.random() * r.length)])
			.setTimestamp(new Date().toISOString());

		if (msg.gConfig.settings.commandImages) {
			if (!msg.channel.permissionsOf(this.user.id).has("attachFiles")) return msg.reply("H-hey! this server has **Command Images** enabled, but I am missing the `attachFiles` permission..");
			// eslint-disable-next-line
			const img = await (type === "blep" ? Yiffy.animals.blep : Yiffy.furry[type as "boop"])("json", 1);
			embed.setImage(img.url);
		}
		return msg.channel.createMessage({
			embeds: [
				embed.toJSON()
			]
		});
	}

	/**
	 * Extra argument parsing for some commands.
	 *
	 * @static
	 * @param {ExtendedMessage} msg - The message instance.
	 * @returns {string}
	 * @memberof BotFunctions
	 * @example BotFunctions.extraArgParsing(<ExtendedMessage>);
	 */
	static extraArgParsing(msg: ExtendedMessage, str = msg.args.join(" ")) {
		(str
			.split(" ")
			// throw away mentions
			.filter(k => !/(?:<@!?)([0-9]{15,21})>/i.exec(k))
			.map(k => /([0-9]{15,21})/i.exec(k))
			.filter(v => v !== null) as Array<RegExpExecArray>)
			.map(([k, id]) => [k, `<@!${id}>`])
			.map(([k, u]) => str = str.replace(k, u));

		str
			.split(" ")
			// throw away mentions & ids
			.filter(k => !/(?:<@!?)?([0-9]{15,21})>?/i.exec(k))
			.map(v => [v, msg.channel.guild.members.find(m => Boolean(
				m.username.toLowerCase() === v.toLowerCase() ||
				m.tag.toLowerCase() === v.toLowerCase() ||
				(m.nick && m.nick.toLowerCase() === v.toLowerCase())
			))] as const)
			.filter(([, v]) => v !== undefined)
			.map(([k, u]) => str = str.replace(k, `<@!${u!.id}>`));

		return str;
	}

	static generateReport(user: Eris.User, entries: Array<AntiSpamEntry>) {
		const now = Date.now();
		const nowD = new Date(now);
		const dir = `${antiSpamDir}/${user.id}`;
		fs.mkdirpSync(dir);
		const oldFiles = fs.readdirSync(dir).filter(r => (fs.lstatSync(`${dir}/${r}`).birthtimeMs + 1.2e5) > now);
		oldFiles.forEach(f => TempFiles.markForDeletion(`${dir}/${f}`, now + 1.8e+6));
		const id = crypto.randomBytes(12).toString("hex");
		fs.writeFileSync(`${dir}/${id}.rpt`, [
			"-- Maid Boye Spam Repot --",
			`Generated Time: ${(nowD.getDate() + 1).toString().padStart(2, "0")}/${nowD.getMonth().toString().padStart(2, "0")}/${nowD.getFullYear().toString().padStart(4, "0")} ${nowD.getHours().toString().padStart(2, "0")}:${nowD.getMinutes().toString().padStart(2, "0")}:${nowD.getSeconds().toString().padStart(2, "0")}`,
			`Beta: ${beta ? "Yes" : "No"}`,
			`User: ${user.tag} (${user.id})`,
			`Report Location: ${dir}/${id}.rpt`,
			`Total VL: ${entries.length}`,
			"",
			"",
			...entries.map(e => {
				const d = new Date(e.addedAt);
				return [
					"-- New Entry --",
					`Command: ${e.command}`,
					`Time: ${(d.getDate() + 1).toString().padStart(2, "0")}/${d.getMonth().toString().padStart(2, "0")}/${d.getFullYear().toString().padStart(4, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`,
					"",
					""
				].join("\n");
			})
		].join("\n"));
		return {
			file: `${dir}/${id}.rpt`,
			id,
			url: `${apiURL}/reports/${user.id}/${id}`
		};
	}

	static parseBit(d: BitData) {
		return Object.keys(d).includes("0") ? Number(d) :
			"toJSON" in d ? d.toJSON().data[0] :
				"data" in d ? d.data[0] :
					-1;
	}

	static calcExp(lvl: number) {
		const k = {
			lvl: lvl < levelingFlatRateStart ? lvl * levelingStartRate : levelingFlatRate,
			total: 0
		};
		if (lvl <= levelingFlatRateStart) for (let i = 0; i <= lvl; i++) k.total += i < levelingFlatRateStart ? i * 100 : levelingFlatRate;
		else {
			const { total: t } = this.calcExp(levelingFlatRateStart);
			k.total = t + (lvl - levelingFlatRateStart) * levelingFlatRate;
		}
		return k;
	}

	static calcLevel(exp: number) {
		let e = Number(exp), lvl = 0, complete = false;
		const { total: t } = this.calcExp(levelingFlatRateStart);
		if (exp <= t) {
			while (!complete) {
				const l = this.calcExp(lvl + 1).lvl;
				if (e >= l) {
					e -= l;
					lvl++;
				} else complete = true;
			}
		} else {
			// leftover exp after level 20
			const l = exp - t;
			// leftover exp
			const a = l % levelingFlatRate;
			// levels above 20
			const b = Math.floor(l / levelingFlatRate);
			lvl = b + levelingFlatRateStart;
			e = a;
		}

		return {
			level: lvl,
			total: exp,
			leftover: e,
			needed: this.calcExp(lvl + 1).lvl - e
		};
	}

	/**
	 * Replaces all normally provided things with empty versions
	 *
	 * @param {Eris.MessageContent} newContent - the new content
	 * @returns {Eris.AdvancedMessageContent}
	 */
	static replaceContent(newContent: Eris.MessageContent) {
		return {
			components: [],
			content: "",
			embeds: [],
			stickerIDs: [],
			...(typeof newContent === "string" ? { content: newContent } : newContent)
		} as Eris.AdvancedMessageContent;
	}

	static async getAuditLogEntry(guild: Eris.Guild, type: keyof typeof Eris["Constants"]["AuditLogActions"], filter: (log: GuildAuditLogEntry) => boolean = () => true) {
		const log = await guild.getAuditLog({ actionType: Eris.Constants.AuditLogActions[type] });
		return log.entries.find(filter) ?? null;
	}

	static async getGlobalLeaderboard(page = 1, desc = true) {
		if (Redis) {
			const cache = await Redis.get(`cache:lb:global:${page}:${desc ? "desc" : "asc"}`);
			if (cache) return JSON.parse<typeof r>(cache);
		}
		const lb = await db.query(`SELECT * FROM levels ORDER BY xp${desc ? " DESC" : " ASC"}${page === -1 ? "" : ` LIMIT ${lbPerPage} OFFSET ${(page - 1) * lbPerPage}`}`) as Array<RawLevel>;
		const r = lb.map(level => ({
			user: level.user_id,
			guild: level.guild_id,
			xp: this.calcLevel(level.xp)
		}));
		// cache global leaderboards for 5 minutes
		if (Redis) void Redis.setex(`cache:lb:global:${page}:${desc ? "desc" : "asc"}`, 300, JSON.stringify(r));
		return r;
	}

	static async getGuildLeaderboard(guild: string, page = 1, desc = true) {
		if (Redis) {
			const cache = await Redis.get(`cache:lb:${guild}:${page}:${desc ? "desc" : "asc"}`);
			if (cache) return JSON.parse<typeof r>(cache);
		}
		const lb = await db.query(`SELECT * FROM levels WHERE guild_id=? ORDER BY xp${desc ? " DESC" : " ASC"}${page === -1 ? "" : ` LIMIT ${lbPerPage} OFFSET ${(page - 1) * lbPerPage}`}`, [guild]) as Array<RawLevel>;
		const r = lb.map(level => ({
			user: level.user_id,
			guild: level.guild_id,
			xp: this.calcLevel(level.xp)
		}));
		// cache guild leaderboards for 2 minutes
		if (Redis) void Redis.setex(`cache:lb:${guild}:${page}:${desc ? "desc" : "asc"}`, 120, JSON.stringify(r));
		return r;
	}

	static async getGlobalRank(user: string) {
		const [rank] = await db.query("SELECT * FROM (SELECT @rank:=@rank+1 AS pos, (SELECT COUNT(*) FROM levels) AS total, id, user_id, guild_id, xp FROM levels, (SELECT @rank := 0) r ORDER BY xp DESC) t WHERE user_id = ? LIMIT 1", [user]) as Array<RawLevel & { pos: number; total: number; }>;
		return !rank ? null : {
			rank: rank.pos,
			total: rank.total,
			user: rank.user_id,
			guild: rank.guild_id,
			xp: this.calcLevel(rank.xp)
		};
	}

	static async getGuildRank(guild: string, user: string) {
		const [rank] = await db.query("SELECT * FROM (SELECT @rank:=@rank+1 AS pos, (SELECT COUNT(*) FROM levels WHERE guild_id = ?) AS total, id, user_id, guild_id, xp FROM levels, (SELECT @rank := 0) r  WHERE guild_id = ? ORDER BY xp DESC) t WHERE user_id = ? LIMIT 1", [guild, guild, user]) as Array<RawLevel & { pos: number; total: number; }>;
		return !rank ? null : {
			rank: rank.pos,
			total: rank.total,
			user: rank.user_id,
			guild: rank.guild_id,
			xp: this.calcLevel(rank.xp)
		};
	}
}
