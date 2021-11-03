import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import GuildConfig from "@models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import type Eris from "eris";
import { names } from "@config";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("channelCreate", async function(channel) {
	if (!("guild" in channel)) return;

	const logEvents = await GuildConfig.getLogEvents(channel.guild.id, "channelCreate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const parent = channel.parentID === null ? null : channel.guild.channels.get(channel.parentID) ?? null;
		const e = new EmbedBuilder(true)
			.setTitle("Channel Created")
			.setColor("green")
			.addField("Channel Info", [
				`Name: **${channel.name}**`,
				`Type: **${names.channelTypes[channel.typeString]}**`,
				`Parent: **${channel.parentID === null ? "[NONE]" : parent === null ? channel.parentID : parent.name}**`,
				`NSFW: **${channel.nsfw ? "Yes" : "No"}**`,
				`SlowMode: **${["GUILD_TEXT", "GUILD_NEWS", "GUILD_NEWS_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_PRIVATE_THREAD"].includes(channel.typeString) ? Time.ms((channel as Eris.GuildTextableChannel).rateLimitPerUser * 1000, true) : ""}**`
			].join("\n"), false);

		if (channel.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(channel.guild, "CHANNEL_CREATE", (a) => a.targetID === channel.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
