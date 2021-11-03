import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import GuildConfig from "@models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("inviteCreate", async function(guild, invite) {
	const logEvents = await GuildConfig.getLogEvents(guild.id, "inviteCreate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const user = !invite.inviter ? "**Unknown**" : `**${invite.inviter.tag}** (<@!${invite.inviter.id}>)`;
		const e = new EmbedBuilder(true)
			.setTitle("Invite Created")
			.setColor("green")
			.addField("Invite Info", [
				`Channel: ${invite.channel.type === Eris.Constants.ChannelTypes.GUILD_CATEGORY ? invite.channel.name! : `<#${invite.channel.id}>`}`,
				`Max Age: ${invite.maxAge === 0 ? "Permanent" : `${Time.ms(invite.maxAge * 1000, true)} (${BotFunctions.formatDiscordTime(Math.floor(Date.now() / 1000) + invite.maxAge, "relative")})`}`,
				`Uses: **${invite.uses}/${invite.maxUses === 0 ? "Unlimited" : invite.maxUses}**`,
				`Temporary: **${invite.temporary ? "Yes" : "No"}**`,
				`Creator: ${user}`
			].join("\n"), false);

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "INVITE_CREATE", (a) => a.after !== null && a.after.code === invite.code);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
