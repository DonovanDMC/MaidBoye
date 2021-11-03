import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";
import Eris from "eris";

export default new ClientEvent("userUpdate", async function(user, oldUser) {
	if (oldUser === null) return;
	const embeds = [] as Array<Eris.EmbedOptions>;

	if (oldUser.accentColor !== user.accentColor) embeds.push(new EmbedBuilder(true)
		.setTitle("Member Updated")
		.setColor("gold")
		.setDescription([
			`Member: ${user.tag} (<@!${user.id}>)`,
			"This user changed their accent color."
		])
		.addField("Old Accent Color", `${!oldUser.accentColor ? "[NONE]" : oldUser.accentColor}`, false)
		.addField("New Accent Color", `${!user.accentColor ? "[NONE]" : user.accentColor}`, false)
		.toJSON()
	);

	if (oldUser.avatar !== user.avatar) embeds.push(new EmbedBuilder(true)
		.setTitle("Member Updated")
		.setColor("gold")
		.setDescription([
			`Member: ${user.tag} (<@!${user.id}>)`,
			"This user changed their global avatar.",
			"",
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			oldUser.avatar === null ? "[No Old Avatar]" : `[Old Avatar](${Object.getOwnPropertyDescriptor(Eris.User.prototype, "avatarURL")!.get!.call({ _client: this, id: user.id, avatar: oldUser.avatar })})`,
			user.avatar === null ? "[No New Avatar]" : `[New Avatar](${user.avatarURL})`
		])
		.toJSON()
	);

	if (oldUser.banner !== user.banner) embeds.push(new EmbedBuilder(true)
		.setTitle("Member Updated")
		.setColor("gold")
		.setDescription([
			`Member: ${user.tag} (<@!${user.id}>)`,
			"This user changed their banner.",
			"",
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			oldUser.banner === null ? "[No Old Banner]" : `[Old Banner](${Object.getOwnPropertyDescriptor(Eris.User.prototype, "bannerURL")!.get!.call({ _client: this, id: user.id, avatar: oldUser.avatar })})`,
			user.banner === null ? "[No New Banner]" : `[New Banner](${user.bannerURL!})`
		])
		.toJSON()
	);

	if (oldUser.discriminator !== user.discriminator) embeds.push(new EmbedBuilder(true)
		.setTitle("Member Updated")
		.setColor("gold")
		.setDescription([
			`Member: ${user.tag} (<@!${user.id}>)`,
			"This user changed their discriminator."
		])
		.addField("Old Discriminator", oldUser.discriminator, false)
		.addField("New Discriminator", user.discriminator, false)
		.toJSON()
	);

	if (oldUser.username !== user.username) embeds.push(new EmbedBuilder(true)
		.setTitle("Member Updated")
		.setColor("gold")
		.setDescription([
			`Member: ${user.tag} (<@!${user.id}>)`,
			"This user changed their username."
		])
		.addField("Old Username", oldUser.username, false)
		.addField("New Username", user.username, false)
		.toJSON()
	);

	if (embeds.length > 0) {
		const guilds = this.guilds.filter(g => g.members.has(user.id));
		for (const guild of guilds) {
			const logEvents = await GuildConfig.getLogEvents(guild.id, "memberUpdate");
			for (const log of logEvents) {
				const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
				if (hook === null || !hook.token) {
					void LoggingWebhookFailureHandler.tick(log);
					continue;
				}

				await this.executeWebhook(hook.id, hook.token, { embeds });
			}
		}
	}
});
