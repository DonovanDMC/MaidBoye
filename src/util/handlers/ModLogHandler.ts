import db from "../../db";
import GuildConfig from "../../db/Models/GuildConfig";
import MaidBoye from "../../main";
import Eris from "eris";
import { BanEntry, UnBanEntry } from "@util/@types/ModLog";
import EmbedBuilder from "@util/EmbedBuilder";
import config from "@config";
import { Time } from "@uwu-codes/utils";
import Logger from "@util/Logger";
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

	static async createBanEntry(guild: GuildConfig, target: Eris.User, blame: Eris.User | null, reason: string | null, time: number, deleteDays: number) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const timedId = time === 0 ? null : await TimedModerationHandler.add(guild.id, target.id, "ban", time);
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Banned | Case #${entryId}`)
					.setAuthor(target.tag, target.avatarURL)
					.setDescription(
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
			timedId
		});

		return { id, entryId };
	}

	static async createUnBanEntry(guild: GuildConfig, target: Eris.User, blame: Eris.User | null, reason: string | null) {
		const check = await this.check(guild);
		if (check === false) return false;
		const entryId = await this.getEntryId(guild.id);
		const id = crypto.randomBytes(6).toString("hex");
		const m = await this.executeWebhook(guild, {
			embeds: [
				new EmbedBuilder()
					.setTitle(`User Unbanned | Case #${entryId}`)
					.setAuthor(target.tag, target.avatarURL)
					.setDescription(
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
			type: "unban"
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
		const id = crypto.randomBytes(3).toString("hex");
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
			const b = m === undefined ? null : await ModLogHandler.client.getUser(m.blame);
			const u = await ModLogHandler.client.getUser(entry.userId);
			if (u === null) {
				await this.remove(entry.id);
				continue;
			}

			switch (entry.type) {
				case "ban": {
					const v = await ModLogHandler.check(g);
					const unb = await ModLogHandler.client.unbanGuildMember(entry.guildId, entry.userId, `Timed Unban (${b === null ? "Unknown" : b.tag})`).then(() => true).catch(() => false);
					if (v) {
						if (unb === false) await ModLogHandler.executeWebhook(g, {
							embeds: [
								new EmbedBuilder()
									.setTitle("Unban Failed")
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
			}
		}
	}
}
