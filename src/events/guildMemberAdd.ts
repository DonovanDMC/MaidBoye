import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import { developers, emojis, names } from "@config";
import LoggingWebhookFailureHandler from "@util/handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("guildMemberAdd", async function(guild, member) {
	const logEvents = await GuildConfig.getLogEvents(guild.id, "memberAdd");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const badges: Array<keyof typeof names["badges"]> = BotFunctions.getUserFlagsArray(member.user);
		if (developers.includes(member.id)) badges.push("DEVELOPER");
		if (badges.length === 0) badges.push("NONE");

		const e = new EmbedBuilder(true)
			.setTitle("Member Joined")
			.setColor("green")
			.addField("Member Info", [
				`User: ${member.tag} (<@!${member.id}>)`,
				`Nickname: ${member.nick ?? "[NONE]"}`,
				`Roles: ${member.roles.map(r => `<@&${r}>`).join(" ")}`,
				`Created At: ${BotFunctions.formatDiscordTime(member.createdAt, "short-datetime", true)}`,
				`Pending: **${member.pending ? "Yes" : "No"}**`,
				"",
				"**Badges**:",
				...badges.map(f => `${emojis.default.dot} ${names.badges[f]}`)
			].join("\n"), false);

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
