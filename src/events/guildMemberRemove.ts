import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import { developers, emojis, names } from "@config";
import LoggingWebhookFailureHandler from "@util/handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("guildMemberRemove", async function(guild, member) {
	const logEvents = await GuildConfig.getLogEvents(guild.id, "memberRemove");
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
			.setTitle("Member Remove")
			.setColor("red")
			.addField("Member Info", [
				`User: ${member.user.username}#${member.user.discriminator} (<@!${member.id}>)`,
				`Nickname: ${("nick" in member ? member.nick : null) ?? "[NONE]"}`,
				`Roles: ${"roles" in member ? member.roles.map(r => `<@&${r}>`).join(" ") : "[UNKNOWN]"}`,
				`Created At: ${BotFunctions.formatDiscordTime(member.user.createdAt, "short-datetime", true)}`,
				`Joined At: ${"joinedAt" in member && member.joinedAt !== null ? BotFunctions.formatDiscordTime(member.joinedAt, "short-datetime", true) : "[UNKNOWN]"}`,
				`Pending: **${"pending" in member ? member.pending ? "Yes" : "No" : "[UNKNOWN]"}**`,
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

	const logEventsKick = await GuildConfig.getLogEvents(guild.id, "memberKick");
	for (const log of logEventsKick) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const badges: Array<keyof typeof names["badges"]> = BotFunctions.getUserFlagsArray(member.user);
		if (developers.includes(member.id)) badges.push("DEVELOPER");
		if (badges.length === 0) badges.push("NONE");

		const e = new EmbedBuilder(true)
			.setTitle("Member Kicked")
			.setColor("orange")
			.addField("Member Info", [
				`User: ${member.user.username}#${member.user.discriminator} (<@!${member.id}>)`,
				`Nickname: ${("nick" in member ? member.nick : null) ?? "[NONE]"}`,
				`Roles: ${"roles" in member ? member.roles.map(r => `<@&${r}>`).join(" ") : "[UNKNOWN]"}`,
				`Created At: ${BotFunctions.formatDiscordTime(member.user.createdAt, "short-datetime", true)}`,
				`Joined At: ${"joinedAt" in member && member.joinedAt !== null ? BotFunctions.formatDiscordTime(member.joinedAt, "short-datetime", true) : "[UNKNOWN]"}`,
				`Pending: **${"pending" in member ? member.pending ? "Yes" : "No" : "[UNKNOWN]"}**`,
				"",
				"**Badges**:",
				...badges.map(f => `${emojis.default.dot} ${names.badges[f]}`)
			].join("\n"), false);

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "MEMBER_KICK", (a) => a.targetID === member.id);
			if (audit !== null) {
				e
					.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false)
					.addField("Reason", audit.reason ?? "[Unknown]", false);
				// we only check for kick logs within the last 5 seconds
				if ((audit.createdAt + 5e3) < Date.now()) continue;
			} else continue;
		} else continue;

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
