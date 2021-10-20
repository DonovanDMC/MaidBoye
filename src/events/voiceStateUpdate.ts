import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import type Eris from "eris";
import BotFunctions from "@util/BotFunctions";

export default new ClientEvent("voiceStateUpdate", async function(member, oldState) {

	const logEvents = await GuildConfig.getLogEvents(member.guild.id, "voiceStateUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;
		let checkAudit = false;

		if (oldState.deaf !== member.voiceState.deaf) {
			embeds.push(new EmbedBuilder(true)
				.setTitle("Member's Voice State Updated")
				.setColor("gold")
				.setDescription([
					`Member: **${member.tag}** (<@!${member.id}>)`,
					oldState.deaf === false ? "This user was deafened." : "This user was undeafened."
				])
				.toJSON()
			);
			checkAudit = true;
		}

		if (oldState.mute !== member.voiceState.mute) {
			embeds.push(new EmbedBuilder(true)
				.setTitle("Member's Voice State Updated")
				.setColor("gold")
				.setDescription([
					`Member: **${member.tag}** (<@!${member.id}>)`,
					oldState.deaf === false ? "This user was Muted." : "This user was unmuted."
				])
				.toJSON()
			);
			checkAudit = true;
		}

		if (oldState.selfDeaf !== member.voiceState.selfDeaf) embeds.push(new EmbedBuilder(true)
			.setTitle("Member's Voice State Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				oldState.deaf === false ? "This user deafened themself." : "This user undeafened themself."
			])
			.toJSON()
		);

		if (oldState.selfMute !== member.voiceState.selfMute) embeds.push(new EmbedBuilder(true)
			.setTitle("Member's Voice State Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				oldState.deaf === false ? "This user muted themself." : "This user unmuted themself."
			])
			.toJSON()
		);

		if (oldState.selfStream !== member.voiceState.selfStream) embeds.push(new EmbedBuilder(true)
			.setTitle("Member's Voice State Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				oldState.deaf === false ? "This user started streaming." : "This user stopped streaming."
			])
			.toJSON()
		);

		if (oldState.selfVideo !== member.voiceState.selfVideo) embeds.push(new EmbedBuilder(true)
			.setTitle("Member's Voice State Updated")
			.setColor("gold")
			.setDescription([
				`Member: **${member.tag}** (<@!${member.id}>)`,
				oldState.deaf === false ? "This user started videoing." : "This user stopped videoing."
			])
			.toJSON()
		);

		if (embeds.length === 0) continue;

		if (checkAudit && member.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(member.guild, "MEMBER_UPDATE", (a) => a.targetID === member.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Member Voice State Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
