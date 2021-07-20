import db from "../../db";
import GuildConfig from "../../db/Models/GuildConfig";
import MaidBoye from "../../main";
import Eris from "eris";
import EmbedBuilder from "@util/EmbedBuilder";
import config from "@config";
import { Time } from "@uwu-codes/utils";
import Logger from "@util/Logger";
import {
	BanEntry, KickEntry, LockEntry,
	LockDownEntry, MuteEntry, /* CleanEntry, */
	SoftBanEntry, UnBanEntry, UnlockEntry,
	UnLockDownEntry, UnMuteEntry, WarnEntry,
	DeleteWarningEntry, ClearWarningsEntry
} from "@util/@types/ModLog";
import crypto from "crypto";

export default class ModLogHandler {
	static client: MaidBoye;
	static setClient(client: MaidBoye) {
		this.client = client;
		return this;
	}

	static async check(guild: string | GuildConfig) {
		if (!(guild instanceof GuildConfig)) guild = await db.getGuild(guild);
		if (guild.modlog.enabled === true) {
			if (guild.modlog.webhook === null) await guild.mongoEdit({
				$set: {
					"modlog.enabled": false
				}
			});
			else {
				if (!guild.modlog.webhook.id || !guild.modlog.webhook.token) await guild.mongoEdit({
					$set: {
						"modlog.enabled": false,
						"modlog.webhook": null
					}
				});
				else {
					const wh = await this.client.getWebhook(guild.modlog.webhook.id, guild.modlog.webhook.token).catch(() => null);
					if (wh === null) await guild.mongoEdit({
						$set: {
							"modlog.enabled": false,
							"modlog.webhook": null
						}
					});
					else {
						if (!guild.modlog.webhook.channelId) await guild.mongoEdit({
							$set: {
								"modlog.webhook.channelId": wh.channel_id
							}
						});
					}
				}
			}
		}

		return guild.reload().then((r) => r.modlog.enabled);
	}

	static getEntryId(guildId: string) {
		return db.collection("modlog").find({ guildId }).count().then(v => v + 1);
	}

	static async executeWebhook(guild: GuildConfig, payload: Eris.WebhookPayload) {
		if (
			guild.modlog.enabled === false ||
			guild.modlog.webhook === null ||
			!(guild.modlog.webhook.id || guild.modlog.webhook.token)
		) return null;
		return this.client.executeWebhook(guild.modlog.webhook.id, guild.modlog.webhook.token, {
			...payload,
			wait: true
		}).catch(() => null);
	}

	static async createBanEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, time: number, deleteDays: number) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const timedId = time === 0 ? null : await TimedModerationHandler.add(guild.id, target.id, "ban", time);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Banned | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Message Delete Days: **${deleteDays}**`,
						`Time: **${time === 0 ? "Permanent" : Time.ms(time, true, true, false)}** (id: \`${timedId!}\`)`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<BanEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			deleteDays,
			type: "ban",
			timedId,
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createKickEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Kicked | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<KickEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "kick",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createLockEntry(guild: GuildConfig, target: Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Channel Locked | Case #${entryId}`)
					.setAuthor(target.guild.name, target.guild.iconURL ?? undefined)
					.setDescription(
						`Target: <#${target.id}> (\`${target.id}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<LockEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "lock",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createLockDownEntry(guild: GuildConfig, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const g = this.client.guilds.get(guild.id);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Lockdown Initialized | Case #${entryId}`)
					.setAuthor(...(g === undefined ? ["Unknown"] : [g.name, g.iconURL ?? undefined]) as [name: string, icon_url?: string])
					.setDescription(
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<LockDownEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: null,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "lockdown",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createMuteEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, time: number) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const timedId = time === 0 ? null : await TimedModerationHandler.add(guild.id, target.id, "mute", time);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Muted | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Time: **${time === 0 ? "Permanent" : Time.ms(time, true, true, false)}** (id: \`${timedId!}\`)`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<MuteEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "mute",
			timedId,
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	// @TODO modlog entry for clean command
	/* static async createCleanEntry(guild: GuildConfig, target: Eris.User | Eris.Member | Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel> | Eris.Role | string, blame: Eris.User | Eris.Member | null, reason: string | null, time: number) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const timedId = time === 0 ? null : await TimedModerationHandler.add(guild.id, target.id, "mute", time);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Muted | Case #${entryId}`)
					.setAuthor(...(typeof target !== "string" && "guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						target === null ? "" : `Target: ${typeof target === "string" ? `"${target}"` : "tag" in target ? `<@!${target.id}>` : }`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Time: **${time === 0 ? "Permanent" : Time.ms(time, true, true, false)}** (id: \`${timedId!}\`)`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "mute",
			timedId,
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	} */

	static async createSoftBanEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Soft Banned | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("red")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<SoftBanEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "softban",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createUnBanEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Unbanned | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("green")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<UnBanEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unban",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createUnLockEntry(guild: GuildConfig, target: Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Channel UnLocked | Case #${entryId}`)
					.setAuthor(target.guild.name, target.guild.iconURL ?? undefined)
					.setDescription(
						`Target: <#${target.id}> (\`${target.id}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("green")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<UnlockEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unlock",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createUnLockDownEntry(guild: GuildConfig, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const g = this.client.guilds.get(guild.id);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Lockdown Removed | Case #${entryId}`)
					.setAuthor(...(g === undefined ? ["Unknown"] : [g.name, g.iconURL ?? undefined]) as [name: string, icon_url?: string])
					.setDescription(
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("green")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<UnLockDownEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: null,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unlockdown",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createUnMuteEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User UnMuted | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`
					)
					.setColor("green")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<UnMuteEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unmute",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createWarnEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Warned | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Warning Id: **${id}**`
					)
					.setColor("gold")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<WarnEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "warn",
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null,
			active: true
		});

		return { id, entryId };
	}

	static async createDeleteWarnEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, warningId: string) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Warning Removed | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Warning Id: **${warningId}**`
					)
					.setColor("orange")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<DeleteWarningEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "delwarning",
			warningId,
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}

	static async createClearWarningsEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, total: number) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Warnings Cleared | Case #${entryId}`)
					.setAuthor(...("guild" in target ? [target.guild.name, target.guild.iconURL ?? undefined] : [target.tag, target.avatarURL]) as [name: string, icon_url?: string])
					.setDescription(
						`Target: <@${target.id}> (\`${target.tag}\`)`,
						`Reason: **${reason ?? "None Provided"}**`,
						`Total Removed: **${total}**`
					)
					.setColor("green")
					.setFooter(`Action Performed ${blame === null ? "Automatically" : `By ${blame.tag}`}`, blame === null ? config.images.bot : blame.avatarURL)
					.toJSON()
			]
		});
		await db.collection<ClearWarningsEntry>("modlog").insertOne({
			id,
			entryId,
			guildId: guild.id,
			messageId: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "clearwarnings",
			total,
			createdAt: Date.now(),
			lastEditedAt: null,
			lastEditedBy: null
		});

		return { id, entryId };
	}
}


export interface TimedEntry {
	id: string;
	type: "ban" | "mute";
	guildId: string;
	userId: string;
	time: number;
	expiry: number;
}

export class TimedModerationHandler {
	private static interval: NodeJS.Timeout | undefined;
	static get client() { return ModLogHandler.client; }
	static init() {
		this.interval = setInterval(this.process.bind(this), 1e3);
		Logger.getLogger("TimedModerationHandler").info("Successfully initialized.");
	}
	static stop() {
		if (this.interval) clearInterval(this.interval);
		this.interval = undefined;
		Logger.getLogger("TimedModerationHandler").info("Successfully stopped.");
	}

	static async add(guildId: string, userId: string, type: TimedEntry["type"], time: number) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.collection("timed").insertOne({
			id,
			type,
			guildId,
			userId,
			time,
			expiry: Date.now() + time
		});

		return id;
	}

	static async remove(id: string) {
		return db.collection("timed").findOneAndDelete({ id });
	}

	static async process() {
		const d = Date.now();
		const entries = await db.collection("timed").find({}).toArray();
		for (const entry of entries) {
			if (entry.expiry > d) continue;
			Logger.getLogger("TimedModerationHandler").debug(`Processing timed entry "${entry.id}" for the guild "${entry.guildId}"`);
			const g = await db.getGuild(entry.guildId);
			const m = await db.collection<BanEntry>("modlog").findOne({ timedId: entry.id });
			const b = m === undefined ? null : await this.client.getUser(m.blame);
			const u = await this.client.getUser(entry.userId);
			if (u === null) {
				await this.remove(entry.id);
				continue;
			}

			switch (entry.type) {
				case "ban": {
					const v = await ModLogHandler.check(g);
					const unb = await this.client.unbanGuildMember(entry.guildId, entry.userId, `Timed Unban (${b === null ? "Unknown" : b.tag})`).then(() => true).catch(() => false);
					if (v) {
						if (unb === false) await ModLogHandler.executeWebhook(g, {
							embeds: [
								new EmbedBuilder()
									.setTitle("Automatic Unban Failed")
									.setAuthor(u.tag, u.avatarURL)
									.setDescription(`I failed to automatically unban <@!${u.id}>.`)
									.setColor("red")
									.setFooter("Action Performed Automatically", config.images.bot)
									.toJSON()
							]
						}); else await ModLogHandler.createUnBanEntry(g, u, null, "Timed Action");
						await this.remove(entry.id);
						continue;
					}
					break;
				}

				case "mute": {
					const v = await ModLogHandler.check(g);
					if (g.settings.muteRole === null) {
						await ModLogHandler.executeWebhook(g, {
							embeds: [
								new EmbedBuilder()
									.setTitle("Automatic Unmute Failed")
									.setAuthor(u.tag, u.avatarURL)
									.setDescription(`I failed to automatically unmute <@!${u.id}>, due to the mute role no longer being set.`)
									.setColor("red")
									.setFooter("Action Performed Automatically", config.images.bot)
									.toJSON()
							]
						});
						await this.remove(entry.id);
						return;
					}
					const hasRole = this.client.guilds.get(g.id)?.roles.has(g.settings.muteRole);
					if (!hasRole) {
					// role might not be cached, because Discord™️
						const hasRoleREST = await ModLogHandler.client.getRESTGuildRoles(g.id).then(r => r.map(j => j.id).includes(g.settings.muteRole!)).catch(() => null);
						// role no longer exists, discard entry
						if (!hasRoleREST) {
							await this.remove(entry.id);
							return;
						}
					}
					const member = await this.client.getMember(entry.guildId, entry.userId);
					if (member === null) {

						await ModLogHandler.executeWebhook(g, {
							embeds: [
								new EmbedBuilder()
									.setTitle("Automatic Unmute Failed")
									.setAuthor(u.tag, u.avatarURL)
									.setDescription(`I failed to automatically unmute <@!${u.id}>, as they are no longer in this server.`)
									.setColor("red")
									.setFooter("Action Performed Automatically", config.images.bot)
									.toJSON()
							]
						});
						await this.remove(entry.id);
						return;
					}
					const unm = await this.client.removeGuildMemberRole(entry.guildId, entry.userId, g.settings.muteRole, `Timed Unmute (${b === null ? "Unknown" : b.tag})`).then(() => true).catch(() => false);
					if (v) {
						if (unm === false) await ModLogHandler.executeWebhook(g, {
							embeds: [
								new EmbedBuilder()
									.setTitle("Automatic Unmute Failed")
									.setAuthor(u.tag, u.avatarURL)
									.setDescription(`I failed to automatically unmute <@!${u.id}>.`)
									.setColor("red")
									.setFooter("Action Performed Automatically", config.images.bot)
									.toJSON()
							]
						}); else await ModLogHandler.createUnMuteEntry(g, u, null, "Timed Action");
						await this.remove(entry.id);
						continue;
					}
					break;
				}
			}
		}
	}
}
