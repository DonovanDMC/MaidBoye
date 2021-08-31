import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import { names } from "@config";
import Eris from "eris";

export default new ClientEvent("threadCreate", async function(thread) {
	if (!("guild" in thread)) return;

	const logEvents = await GuildConfig.getLogEvents(thread.guild.id, "threadCreate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const parent = thread.parentID === null ? null : thread.guild.channels.get(thread.parentID) ?? null;
		const e = new EmbedBuilder(true)
			.setTitle("Thread Created")
			.setColor("green")
			.addField("Thread Info", [
				`Name: **${thread.name}**`,
				`Type: **${names.channelTypes[thread.typeString]}**`,
				`Parent: **${thread.parentID === null ? "[NONE]" : parent === null ? thread.parentID : thread.name}**`,
				`NSFW: **${thread.nsfw ? "Yes" : "No"}**`,
				`SlowMode: **${["GUILD_TEXT", "GUILD_NEWS", "GUILD_NEWS_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_PRIVATE_THREAD"].includes(thread.typeString) ? Time.ms(thread.rateLimitPerUser * 1000, true) : ""}**`,
				`Auto Archive Duration: ${Time.ms(thread.threadMetadata.autoArchiveDuration * 6e4, true)}`,
				`Archive Timestamp: ${BotFunctions.formatDiscordTime(thread.threadMetadata.archiveTimestamp, "short-datetime", true)}`,
				`Archived: **${thread.threadMetadata.archived ? "Yes" : "No"}**`,
				`Locked: **${thread.threadMetadata.locked ? "Yes" : "No"}**`,
				`Invitable: **${thread.type === Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD ? (thread.threadMetadata as Eris.PrivateThreadMetadata).invitable ? "Yes" : "No" : "N/A"}**`
			].join("\n"), false);

		if (thread.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(thread.guild, "THREAD_CREATE", (a) => a.targetID === thread.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
