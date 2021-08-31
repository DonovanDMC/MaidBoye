import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import BotFunctions from "@util/BotFunctions";

export default new ClientEvent("guildMemberUpdate", async function(guild, member, oldMember) {
	if (oldMember === null) return;
	const logEvents = await GuildConfig.getLogEvents(guild.id, "memberUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		if (oldMember.avatar !== member.avatar) embeds.push(new EmbedBuilder(true)
			.setTitle("Member Updated")
			.setColor("gold")
			.setDescription([
				`Member: ${member.tag} (<@!${member.id}>)`,
				"This user changed their server specific avatar.",
				"",
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`[Old Avatar](${Object.getOwnPropertyDescriptor(Eris.Member.prototype, "avatarURL")!.get!.call({ _client: this, id: member.id, avatar: oldMember.avatar })})`,
				`[New Avatar](${member.avatarURL})`
			])
			.toJSON()
		);

		if (oldMember.nick !== member.nick) embeds.push(new EmbedBuilder(true, member.user)
			.setTitle("Member Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				"This member's nickname was changed."
			])
			.addField("Old Nickname", oldMember.nick ?? "[NONE]", false)
			.addField("New Nickname", member.nick ?? "[NONE]", false)
			.toJSON()
		);

		if (oldMember.pending === true && (member.pending === false || member.pending === undefined)) embeds.push(new EmbedBuilder(true, member.user)
			.setTitle("Member Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				"This user passed the welcome gate."
			])
			.toJSON()
		);

		const removedRoles = [] as Array<string>;
		const addedRoles = [] as Array<string>;
		oldMember.roles.forEach(r => {
			if (!member.roles.includes(r)) removedRoles.push(r);
		});
		member.roles.forEach(r => {
			if (!oldMember.roles.includes(r)) addedRoles.push(r);
		});

		if (removedRoles.length > 0 || addedRoles.length > 0) embeds.push(new EmbedBuilder(true, member.user)
			.setTitle("Member Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				"This user had some roles were updated.",
				"(+ = added, - = removed)",
				"",
				"**Changes**:",
				"```diff",
				...addedRoles.map(r => `+ <@&${r}>`),
				...removedRoles.map(r => `- <@&${r}>`),
				"```"
			])
			.toJSON()
		);

		if (embeds.length === 0) continue;

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "CHANNEL_UPDATE", (a) => a.targetID === member.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Member Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
