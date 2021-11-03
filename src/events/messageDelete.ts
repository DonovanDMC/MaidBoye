import ClientEvent from "@util/ClientEvent";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import { Strings } from "@uwu-codes/utils";
import GuildConfig from "@models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";
const Redis = db.r;

export default new ClientEvent("messageDelete", async function(message) {
	if (!("content" in message) || !("guild" in message.channel)) return;
	await Redis
		.multi()
		.lpush(`snipe:delete:${message.channel.id}`, JSON.stringify({
			content: message.content,
			author: message.author.id,
			time: Date.now(),
			ref: !message.referencedMessage ? null : {
				link: message.referencedMessage.jumpLink,
				author: message.referencedMessage.author.id,
				content: message.referencedMessage.content
			}
		}))
		.ltrim(`snipe:delete:${message.channel.id}`, 0, 2)
		.exec();

	const logEvents = await GuildConfig.getLogEvents(message.channel.guild.id, "messageUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const e = new EmbedBuilder(true, message.author)
			.setTitle("Message Deleted")
			.setColor("red")
			.addField("Content", Strings.truncate(message.content || "[No Content]", 1000), false);

		if (message.channel.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(message.channel.guild, "MESSAGE_DELETE", (a) => a.targetID === message.author.id && !!a.channel && a.channel.id === message.channel.id);
			if (audit !== null) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
