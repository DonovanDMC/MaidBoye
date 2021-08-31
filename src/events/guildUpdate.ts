import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import BotFunctions from "@util/BotFunctions";
import { Time } from "@uwu-codes/utils";
import { names } from "@config";
import chunk from "chunk";

export default new ClientEvent("guildUpdate", async function(guild, oldGuild) {

	const logEvents = await GuildConfig.getLogEvents(guild.id, "update");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		if (oldGuild.afkChannelID !== guild.afkChannelID) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's AFK Channel was changed."
			])
			.addField("Old AFK Channel", oldGuild.afkChannelID === null ? "[NONE]" : `<#${oldGuild.afkChannelID}>`, false)
			.addField("New AFK Channel", guild.afkChannelID === null ? "[NONE]" : `<#${guild.afkChannelID}>`, false)
			.toJSON()
		);

		if (oldGuild.afkTimeout !== guild.afkTimeout) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's AFK Timeout was changed."
			])
			.addField("Old AFK Channel", Time.ms(oldGuild.afkTimeout * 1000, true), false)
			.addField("New AFK Channel", Time.ms(guild.afkTimeout * 1000, true), false)
			.toJSON()
		);

		if (oldGuild.banner !== guild.banner) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Banner was changed.",
				"",
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`Old Banner: ${oldGuild.banner === null ? "[NONE]" : `[here](${Object.getOwnPropertyDescriptor(Eris.Guild.prototype, "bannerURL")!.get!.call({ _client: this, id: guild.id, banner: oldGuild.banner })})`})}`,
				`New Banner: ${guild.banner === null ? "[NONE]" : `[here](${guild.bannerURL!})`}`
			])
			.toJSON()
		);

		if (oldGuild.afkTimeout !== guild.afkTimeout) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Default Notifications was changed."
			])
			.addField("Old Default Notifications", names.defaultNotifications[oldGuild.defaultNotifications], false)
			.addField("New Default Notifications", names.defaultNotifications[guild.defaultNotifications], false)
			.toJSON()
		);

		if (oldGuild.description !== guild.description) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Description was changed.")
			.addField("Old Description", oldGuild.description ?? "[NONE]", false)
			.addField("New Description", guild.description ?? "[NONE]", false)
			.toJSON()
		);

		if (oldGuild.discoverySplash !== guild.discoverySplash) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Discovery Splash was changed.",
				"",
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`Old Discovery Splash: ${oldGuild.discoverySplash === null ? "[NONE]" : `[here](${Object.getOwnPropertyDescriptor(Eris.Guild.prototype, "discoverySplashURL")!.get!.call({ _client: this, id: guild.id, splash: oldGuild.discoverySplash })})`})}`,
				`New Discovery Splash: ${guild.discoverySplash === null ? "[NONE]" : `[here](${guild.discoverySplashURL!})`}`
			])
			.toJSON()
		);

		const oldEmojis = oldGuild.emojis.map(e => e.id);
		const newEmojis = guild.emojis.map(e => e.id);
		const addedEmojis = [] as Array<string>;
		const removedEmojis = [] as Array<string>;
		oldGuild.emojis.forEach(e => {
			if (!newEmojis.includes(e.id)) removedEmojis.push(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`);
		});
		guild.emojis.forEach(e => {
			if (!oldEmojis.includes(e.id)) addedEmojis.push(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`);
		});
		if (removedEmojis.length > 0 || addedEmojis.length > 0) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This server's emojis were changed.",
				"(+ = added, - = removed)",
				"",
				"**Changes**:",
				...addedEmojis.map(e => `+ ${e}`),
				...removedEmojis.map(e => `- ${e}`)
			])
			.toJSON()
		);

		if (oldGuild.explicitContentFilter !== guild.explicitContentFilter) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Explicit Content Filter was changed."
			])
			.addField("Old Explicit Content Filter", names.explicitContentFilter[oldGuild.explicitContentFilter], false)
			.addField("New Explicit Content Filter", names.explicitContentFilter[guild.explicitContentFilter], false)
			.toJSON()
		);

		const addedFeatures = [] as Array<string>;
		const removedFeatures = [] as Array<string>;
		oldGuild.features.forEach(f => {
			if (!guild.features.includes(f)) removedFeatures.push(f);
		});
		guild.features.forEach(f => {
			if (!oldGuild.features.includes(f)) addedFeatures.push(f);
		});

		if (addedFeatures.length > 0 || removedFeatures.length > 0) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This server's features were changed.",
				"(+ = added, - = removed)",
				"",
				"**Changes**:",
				"```diff",
				...addedFeatures.map(f => `+ ${names.serverFeatures[f as keyof typeof names["serverFeatures"]] || f}`),
				...removedFeatures.map(f => `- ${names.serverFeatures[f as keyof typeof names["serverFeatures"]] || f}`),
				"```"
			])
			.toJSON()
		);

		if (oldGuild.icon !== guild.icon) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Icon was changed.",
				"",
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`Old Icon: ${oldGuild.icon === null ? "[NONE]" : `[here](${Object.getOwnPropertyDescriptor(Eris.Guild.prototype, "iconURL")!.get!.call({ _client: this, id: guild.id, icon: oldGuild.icon })})`})}`,
				`New Icon: ${guild.icon === null ? "[NONE]" : `[here](${guild.iconURL!})`}`
			])
			.toJSON()
		);

		if (oldGuild.large !== guild.large) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription(oldGuild.large === true ? "This server is no longer considered large." : "This server is now considered large.")
			.toJSON()
		);

		if (oldGuild.maxMembers !== guild.maxMembers) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Max Members was changed.")
			.addField("Old Max Members", String(oldGuild.maxMembers ?? "[NONE]"), false)
			.addField("New Max Members", String(guild.maxMembers), false)
			.toJSON()
		);

		if (oldGuild.maxVideoChannelUsers !== guild.maxVideoChannelUsers) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Max Video Channel Users was changed.")
			.addField("Old Max Video Channel Users", String(oldGuild.maxVideoChannelUsers ?? "[NONE]"), false)
			.addField("New Max Video Channel Users", String(guild.maxVideoChannelUsers ?? "[NONE]"), false)
			.toJSON()
		);

		if (oldGuild.mfaLevel !== guild.mfaLevel) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's MFA Level was changed.")
			.addField("Old MFA Level", names.mfaLevel[oldGuild.mfaLevel], false)
			.addField("New MFA Level", names.mfaLevel[guild.mfaLevel], false)
			.toJSON()
		);

		if (oldGuild.name !== guild.name) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Name was changed.")
			.addField("Old Name", oldGuild.name, false)
			.addField("New name", guild.name, false)
			.toJSON()
		);

		if (oldGuild.nsfwLevel !== guild.nsfwLevel) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's NSFW Level was changed.")
			.addField("Old NSFW Level", names.nsfwLevel[oldGuild.nsfwLevel], false)
			.addField("New NSFW Level", names.nsfwLevel[guild.nsfwLevel], false)
			.toJSON()
		);

		if (oldGuild.ownerID !== guild.ownerID) {
			const oldOwner = await this.getMember(guild.id, oldGuild.ownerID);
			const newOwner = await this.getMember(guild.id, guild.ownerID);
			embeds.push(new EmbedBuilder(true)
				.setTitle("Server Updated")
				.setColor("gold")
				.setDescription("This Server's Owner was changed.")
				.addField("Old Owner", oldOwner === null ? oldGuild.ownerID : `${oldOwner.tag} (${oldOwner.id})`, false)
				.addField("News Owner", newOwner === null ? guild.ownerID : `${newOwner.tag} (${newOwner.id})`, false)
				.toJSON()
			);
		}

		if (oldGuild.preferredLocale !== guild.preferredLocale) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Preferred Locale was changed.")
			.addField("Old Preferred Locale", oldGuild.preferredLocale ?? "[NONE]", false)
			.addField("New Preferred Locale", guild.preferredLocale ?? "[NONE]", false)
			.toJSON()
		);

		if (oldGuild.publicUpdatesChannelID !== guild.publicUpdatesChannelID) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Public Updates Channel was changed.")
			.addField("Old Public Updates Channel", oldGuild.publicUpdatesChannelID === null ? "[NONE]" : `<#${oldGuild.publicUpdatesChannelID}>`, false)
			.addField("New Public Updates Channel", guild.publicUpdatesChannelID === null ? "[NONE]" : `<#${guild.publicUpdatesChannelID}>`, false)
			.toJSON()
		);

		if (oldGuild.rulesChannelID !== guild.rulesChannelID) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Rules Channel was changed.")
			.addField("Old Rules Channel", oldGuild.rulesChannelID === null ? "[NONE]" : `<#${oldGuild.rulesChannelID}>`, false)
			.addField("New Rules Channel", guild.rulesChannelID === null ? "[NONE]" : `<#${guild.rulesChannelID}>`, false)
			.toJSON()
		);

		if (oldGuild.splash !== guild.splash) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This Server's Splash was changed.",
				"",
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`Old Splash: ${oldGuild.splash === null ? "[NONE]" : `[here](${Object.getOwnPropertyDescriptor(Eris.Guild.prototype, "splashURL")!.get!.call({ _client: this, id: guild.id, splash: oldGuild.splash })})`})}`,
				`New Splash: ${guild.splash === null ? "[NONE]" : `[here](${guild.splashURL!})`}`
			])
			.toJSON()
		);


		const oldStickers = (oldGuild.stickers ?? []).map(e => e.id);
		const newStickers = (guild.stickers ?? []).map(e => e.id);
		const addedStickers = [] as Array<Eris.Sticker>;
		const removedStickers = [] as Array<Eris.Sticker>;
		(oldGuild.stickers ?? []).forEach(s => {
			if (!newStickers.includes(s.id)) removedStickers.push(s);
		});
		(guild.stickers ?? []).forEach(s => {
			if (!oldStickers.includes(s.id)) addedStickers.push(s);
		});
		if (removedStickers.length > 0 || addedStickers.length > 0) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription([
				"This server's stickers were changed.",
				"(+ = added, - = removed)",
				"",
				"**Changes**:",
				...addedStickers.map(s => `+ [${s.name}](https://media.discordapp.net/stickers/${s.id}.png?size=4096)`),
				...removedStickers.map(s => `- [${s.name}](https://media.discordapp.net/stickers/${s.id}.png?size=4096)`)
			])
			.toJSON()
		);

		const oldFlags = BotFunctions.getSystemChannelFlags(oldGuild.systemChannelFlags);
		const newFlags = BotFunctions.getSystemChannelFlags(guild.systemChannelFlags);
		if (oldGuild.systemChannelFlags !== guild.systemChannelFlags) {
			if (oldFlags.SUPPRESS_GUILD_REMINDER_NOTIFICATIONS !== newFlags.SUPPRESS_GUILD_REMINDER_NOTIFICATIONS)  embeds.push(new EmbedBuilder(true)
				.setTitle("Server Updated")
				.setColor("gold")
				.setDescription(`This server's system channel had server reminder notifications ${oldFlags.SUPPRESS_GUILD_REMINDER_NOTIFICATIONS ? "disabled" : "enabled"}.`)
				.toJSON()
			);

			if (oldFlags.SUPPRESS_JOIN_NOTIFICATIONS !== newFlags.SUPPRESS_JOIN_NOTIFICATIONS)  embeds.push(new EmbedBuilder(true)
				.setTitle("Server Updated")
				.setColor("gold")
				.setDescription(`This server's system channel had join notifications ${oldFlags.SUPPRESS_JOIN_NOTIFICATIONS ? "disabled" : "enabled"}.`)
				.toJSON()
			);

			if (oldFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS !== newFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS)  embeds.push(new EmbedBuilder(true)
				.setTitle("Server Updated")
				.setColor("gold")
				.setDescription(`This server's system channel had premium subscription notifications ${oldFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS ? "disabled" : "enabled"}.`)
				.toJSON()
			);
		}

		if (oldGuild.systemChannelID !== guild.systemChannelID) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's System Channel was changed.")
			.addField("Old System Channel", oldGuild.systemChannelID === null ? "[NONE]" : `<#${oldGuild.systemChannelID}>`, false)
			.addField("New System Channel", guild.systemChannelID === null ? "[NONE]" : `<#${guild.systemChannelID}>`, false)
			.toJSON()
		);

		if (oldGuild.vanityURL !== guild.vanityURL) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Vanity URL was changed.")
			.addField("Old Vanity URL", oldGuild.vanityURL === null ? "[NONE]" : `[https://discord.gg/${oldGuild.vanityURL}](https://discord.gg/${oldGuild.vanityURL})`, false)
			.addField("New Vanity URL", guild.vanityURL === null ? "[NONE]" : `[https://discord.gg/${guild.vanityURL}](https://discord.gg/${guild.vanityURL})`, false)
			.toJSON()
		);

		if (oldGuild.verificationLevel !== guild.verificationLevel) embeds.push(new EmbedBuilder(true)
			.setTitle("Server Updated")
			.setColor("gold")
			.setDescription("This Server's Verification Level was changed.")
			.addField("Old Verification Level", names.verificationLevel[oldGuild.verificationLevel], false)
			.addField("New Verification Level", names.verificationLevel[guild.verificationLevel], false)
			.toJSON()
		);

		if (embeds.length === 0) continue;

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "GUILD_UPDATE");
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Server Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		// god help us if anyone manages to change EVERYTHING in one event
		const e = chunk(embeds, 10);
		for (const part of e) await this.executeWebhook(hook.id, hook.token, { embeds: part });
	}
});
