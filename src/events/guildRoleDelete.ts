import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import LoggingWebhookFailureHandler from "@util/handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("guildRoleDelete", async function(guild, role) {
	const logEvents = await GuildConfig.getLogEvents(guild.id, "roleDelete");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const e = new EmbedBuilder(true)
			.setTitle("Role Deleted")
			.setColor("red")
			.addField("Role Info", [
				`Name: **${role.name}**`,
				`Color: **${role.color === 0 ? "[NONE]" : `#${role.color.toString(16).padStart(6, "0").toUpperCase()}`}**`,
				`Hoisted: **${role.hoist ? "Yes" : "No"}**`,
				`Managed: **${role.managed ? "Yes" : "No"}**`,
				`Mentionable: **${role.mentionable ? "Yes" : "No"}**`,
				`Permissions: [${role.permissions.allow}](https://discordapi.com/permissions.html#${role.permissions.allow})`,
				`Position: **${role.position}**`
			].join("\n"), false);

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "ROLE_DELETE", (a) => a.targetID === role.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
