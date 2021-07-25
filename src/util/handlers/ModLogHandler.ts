import db from "../../db";
import GuildConfig from "../../db/Models/Guild/GuildConfig";
import MaidBoye from "../../main";
import Eris from "eris";
import EmbedBuilder from "@util/EmbedBuilder";
import config from "@config";
import { Time } from "@uwu-codes/utils";
import Logger from "@util/Logger";
import { CountResponse, OkPacket } from "@util/@types/MariaDB";
import TimedEntry, { RawTimedEntry } from "@db/Models/TimedEntry";
import { RawBanEntry } from "@db/Models/Guild/ModLog/BanEntry";
import { RawMuteEntry } from "@db/Models/Guild/ModLog/MuteEntry";
import UserConfig from "@db/Models/User/UserConfig";
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
			if (guild.modlog.webhook === null) await guild.edit({
				modlog: {
					enabled: false
				}
			});
			else {
				if (!guild.modlog.webhook.id || !guild.modlog.webhook.token) await guild.edit({
					modlog: {
						enabled: false,
						webhook: null
					}
				});
				else {
					const wh = await this.client.getWebhook(guild.modlog.webhook.id, guild.modlog.webhook.token).catch(() => null);
					if (wh === null) await guild.edit({
						modlog: {
							enabled: false,
							webhook: null
						}
					});
					else {
						if (wh.channel_id !== undefined && guild.modlog.webhook.channelId !== wh.channel_id) await guild.edit({
							modlog: {
								webhook: {
									channelId: wh.channel_id!
								}
							}
						});
					}
				}
			}
		}

		return guild.reload().then((r) => r.modlog.enabled);
	}

	static getEntryId(guildId: string) {
		return db.query("SELECT COUNT(*) FROM modlog WHERE guild_id=?", [guildId]).then((v: CountResponse) => (Number(v[0]["COUNT(*)"] ?? 0) + 1));
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
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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
		// I prefer doing this over the db call required for getting the full user
		const [strikeId] = await UserConfig.prototype.addStrike.call({ id: target.id }, guild.id, blame === null ? "automatic" : blame.id);

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			strike_id: strikeId,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "ban",
			created_at: Date.now(),
			delete_days: deleteDays,
			timed_id: timedId
		});

		return { id, entryId, check, strikeId, timedId };
	}

	static async createKickEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		const [strikeId] = await UserConfig.prototype.addStrike.call({ id: target.id }, guild.id, blame === null ? "automatic" : blame.id);

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			strike_id: strikeId,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "kick",
			created_at: Date.now()
		});

		return { id, entryId, check, strikeId };
	}

	static async createLockEntry(guild: GuildConfig, target: Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "lock",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createLockDownEntry(guild: GuildConfig, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "lockdown",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createMuteEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, time: number) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		const [strikeId] = await UserConfig.prototype.addStrike.call({ id: target.id }, guild.id, blame === null ? "automatic" : blame.id);

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			strike_id: strikeId,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "mute",
			created_at: Date.now(),
			timed_id: timedId
		});

		return { id, entryId, check, strikeId };
	}

	static async createSoftBanEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, deleteDays: number) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		const [strikeId] = await UserConfig.prototype.addStrike.call({ id: target.id }, guild.id, blame === null ? "automatic" : blame.id);

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			strike_id: strikeId,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "softban",
			created_at: Date.now(),
			delete_days: deleteDays
		});

		return { id, entryId, check, strikeId };
	}

	static async createUnBanEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		// no strike
		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unban",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createUnLockEntry(guild: GuildConfig, target: Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unlock",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createUnLockDownEntry(guild: GuildConfig, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unlockdown",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createUnMuteEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Unmuted | Case #${entryId}`)
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "unban",
			created_at: Date.now()
		});

		return { id, entryId, check };
	}

	static async createWarnEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		const [strikeId] = await UserConfig.prototype.addStrike.call({ id: target.id }, guild.id, blame === null ? "automatic" : blame.id);

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			strike_id: strikeId,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "warn",
			created_at: Date.now(),
			active: true
		});

		return { id, entryId, check };
	}

	static async createDeleteWarnEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, warningId: string) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "deletewarning",
			created_at: Date.now(),
			warning_id: warningId
		});

		return { id, entryId, check };
	}

	static async createClearWarningsEntry(guild: GuildConfig, target: Eris.User | Eris.Member, blame: Eris.User | Eris.Member | null, reason: string | null, total: number) {
		const check = await this.check(guild);
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		await db.createUserIfNotExists(target.id);
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

		await db.insert("modlog", {
			id,
			entry_id: entryId,
			guild_id: guild.id,
			message_id: m === null ? null : m.id,
			target: target.id,
			blame: blame === null ? "automatic" : blame.id,
			reason,
			type: "clearwarnings",
			created_at: Date.now(),
			total
		});

		return { id, entryId, check };
	}
}

export class TimedModerationHandler {
	private static interval: NodeJS.Timeout | undefined;
	static get client() { return ModLogHandler.client; }
	private static processed = [] as Array<string>;
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
		await db.createUserIfNotExists(userId);
		await db.query("INSERT INTO timed (id, type, guild_id, user_id, time, expiry) VALUES (?, ?, ?, ?, ?, ?)", [
			id,
			type,
			guildId,
			userId,
			time,
			Date.now() + time
		]);

		return id;
	}

	static async remove(id: string) {
		return db.query("DELETE FROM timed WHERE id=?", [id]).then((r: OkPacket) => r.affectedRows > 0);
	}

	static async process() {
		const entries = await db.query("SELECT * FROM timed WHERE expiry <= ROUND(UNIX_TIMESTAMP() * 1000)") as Array<RawTimedEntry>;
		for (const e of entries) {
			const entry = new TimedEntry(e);
			if (this.processed.includes(entry.id)) continue;
			this.processed.push(entry.id);
			Logger.getLogger("TimedModerationHandler").debug(`Processing timed entry "${entry.id}" for the guild "${entry.guildId}"`);
			const g = await db.getGuild(entry.guildId);
			const [m] = await db.query("SELECT * FROM modlog WHERE timed_id=?", [entry.id]) as Array<RawBanEntry | RawMuteEntry>;
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
