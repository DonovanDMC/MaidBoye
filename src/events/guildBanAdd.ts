import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";

export default new ClientEvent("guildBanAdd", async function(guild, user) {
	const logEvents = await GuildConfig.getLogEvents(guild.id, "banAdd");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const e = new EmbedBuilder(true)
			.setTitle("Member Banned")
			.setColor("red")
			.addField("Member", `${user.tag} (${user.id})`, false);

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "MEMBER_BAN_ADD", (a) => a.targetID === user.id);
			if (audit !== null) e
				.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false)
				.addField("Reason", audit.reason ?? "[Unknown]", false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
