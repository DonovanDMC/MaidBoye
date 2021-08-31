import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";

export default new ClientEvent("voiceChannelLeave", async function(member, channel) {
	if (!("guild" in channel)) return;

	const logEvents = await GuildConfig.getLogEvents(channel.guild.id, "voiceJoin");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const e = new EmbedBuilder(true)
			.setTitle("Voice Channel Left")
			.setColor("red")
			.setDescription(`<@!${member.id}> left the voice channel <#${channel.id}>.`);

		if (channel.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(channel.guild, "MEMBER_DISCONNECT", (a) => a.targetID === channel.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
