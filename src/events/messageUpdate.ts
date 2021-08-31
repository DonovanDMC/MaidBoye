import ClientEvent from "@util/ClientEvent";
import db from "@db";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import { Strings } from "@uwu-codes/utils";
import Eris from "eris";
import BotFunctions from "@util/BotFunctions";
const Redis = db.r;

export default new ClientEvent("messageUpdate", async function(message, oldMessage) {
	if (oldMessage === null || !("guild" in message.channel)) return;
	if (message.content !== oldMessage.content) await Redis
		.multi()
		.lpush(`snipe:edit:${message.channel.id}`, JSON.stringify({
			newContent: message.content,
			oldContent: oldMessage.content,
			author: message.author.id,
			time: Date.now()
		}))
		.ltrim(`snipe:edit:${message.channel.id}`, 0, 2)
		.exec();

	const logEvents = await GuildConfig.getLogEvents(message.channel.guild.id, "messageUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		if (oldMessage.content !== message.content) embeds.push(new EmbedBuilder(true, message.author)
			.setTitle("Message Updated")
			.setColor("gold")
			.setDescription(`The message content was updated.\n\n[[Jump Link](${message.jumpLink})]`)
			.addField("Old Content", Strings.truncate(oldMessage.content || "[No Content]", 1000), false)
			.addField("New Content", Strings.truncate(message.content || "[Content Was Cleared]", 1000), false)
			.toJSON()
		);

		const oldFlags = BotFunctions.getMessageFlags(oldMessage.flags);
		const newFlags = BotFunctions.getMessageFlags(message.flags);
		if (oldMessage.flags !== message.flags) {
			if (!oldFlags.CROSSPOSTED && newFlags.CROSSPOSTED)  embeds.push(new EmbedBuilder(true, message.author)
				.setTitle("Message Updated")
				.setColor("gold")
				.setDescription(`The message was crossposted.\n\n[[Jump Link](${message.jumpLink})]`)
				.toJSON()
			);

			if (!oldFlags.SUPPRESS_EMBEDS && newFlags.SUPPRESS_EMBEDS)  embeds.push(new EmbedBuilder(true, message.author)
				.setTitle("Message Updated")
				.setColor("gold")
				.setDescription(`The embeds of this message were suppressed.\n\n[[Jump Link](${message.jumpLink})]`)
				.toJSON()
			);

			if (oldFlags.SUPPRESS_EMBEDS && !newFlags.SUPPRESS_EMBEDS)  embeds.push(new EmbedBuilder(true, message.author)
				.setTitle("Message Updated")
				.setColor("gold")
				.setDescription(`The embeds of this message were unsuppressed.\n\n[[Jump Link](${message.jumpLink})]`)
				.toJSON()
			);

			if (!oldFlags.SOURCE_MESSAGE_DELETED && newFlags.SOURCE_MESSAGE_DELETED)  embeds.push(new EmbedBuilder(true, message.author)
				.setTitle("Message Updated")
				.setColor("gold")
				.setDescription(`The message this was replying to was deleted.\n\n[[Jump Link](${message.jumpLink})]`)
				.toJSON()
			);

			if (!oldFlags.HAS_THREAD && newFlags.HAS_THREAD)  embeds.push(new EmbedBuilder(true, message.author)
				.setTitle("Message Updated")
				.setColor("gold")
				.setDescription(`A thread was created with this message as its starter.\n\n[[Jump Link](${message.jumpLink})]`)
				.toJSON()
			);
		}

		if (embeds.length === 0) continue;

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
