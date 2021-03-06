import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@models/Guild/GuildConfig";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("voiceChannelJoin", async function(member, channel) {
	if (!("guild" in channel)) return;

	const logEvents = await GuildConfig.getLogEvents(channel.guild.id, "voiceJoin");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				new EmbedBuilder(true)
					.setTitle("Voice Channel Joined")
					.setColor("green")
					.setDescription(`<@!${member.id}> joined the voice channel <#${channel.id}>.`)
					.toJSON()
			]
		});
	}
});
