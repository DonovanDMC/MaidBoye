import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import Eris from "eris";
import BotFunctions from "@util/BotFunctions";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("channelUpdate", async function(channel, oldChannel) {
	if (!("guild" in channel)) return;

	const logEvents = await GuildConfig.getLogEvents(channel.guild.id, "channelUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		// I know channel types can't change, but this is for narrowing
		if (
			(channel.type === Eris.Constants.ChannelTypes.GUILD_TEXT || channel.type === Eris.Constants.ChannelTypes.GUILD_NEWS)
			&&
			(oldChannel.type === Eris.Constants.ChannelTypes.GUILD_TEXT || oldChannel.type === Eris.Constants.ChannelTypes.GUILD_NEWS)
		) {
			if (oldChannel.nsfw !== channel.nsfw) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					channel.nsfw === true ? "This channel was made NSFW." : "This channel was made not NSFW."
				])
				.toJSON()
			);

			if (oldChannel.rateLimitPerUser !== channel.rateLimitPerUser) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's Slow Mode was updated."
				])
				.addField("Old SlowMode", Time.ms((oldChannel.rateLimitPerUser ?? 0) * 1000), false)
				.addField("New SlowMode", Time.ms((channel.rateLimitPerUser ?? 0) * 1000), false)
				.toJSON()
			);

			// because sometimes Discord sends null, and sometimes
			// Discord sends an empty string
			const oldTopic = oldChannel.topic || null;
			const newTopic = channel.topic || null;

			if (oldTopic !== newTopic) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's topic was updated."
				])
				.addField("Old Topic", oldTopic ?? "[NONE]", false)
				.addField("New Topic", newTopic ?? "[NONE]", false)
				.toJSON()
			);
		}

		if (
			(channel.type === Eris.Constants.ChannelTypes.GUILD_VOICE || channel.type === Eris.Constants.ChannelTypes.GUILD_STAGE)
			&&
			(oldChannel.type === Eris.Constants.ChannelTypes.GUILD_VOICE || oldChannel.type === Eris.Constants.ChannelTypes.GUILD_STAGE)
		) {
			if (oldChannel.bitrate !== channel.bitrate) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's bitrate was updated."
				])
				.addField("Old Bitrate", `${!oldChannel.bitrate ? "[NONE]" : `${oldChannel.bitrate}kbps`}`, false)
				.addField("New Bitrate", `${channel.bitrate}kbps`, false)
				.toJSON()
			);

			if (oldChannel.rtcRegion !== channel.rtcRegion) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's region was updated."
				])
				.addField("Old Region", `${!oldChannel.rtcRegion ? "[NONE]" : oldChannel.rtcRegion}`, false)
				.addField("New Region", `${channel.rtcRegion === null ? "[NONE]" : channel.rtcRegion}`, false)
				.toJSON()
			);

			if (oldChannel.rtcRegion !== channel.rtcRegion) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's user limit was updated."
				])
				.addField("Old User Limit", `${!(oldChannel as Eris.OldGuildVoiceChannel).userLimit ? "[NONE]" : (oldChannel as Eris.OldGuildVoiceChannel).userLimit}`, false)
				.addField("New User Limit", String(channel.userLimit), false)
				.toJSON()
			);

			if ((oldChannel as Eris.OldGuildVoiceChannel).videoQualityMode !== channel.videoQualityMode) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Updated")
				.setColor("gold")
				.setDescription([
					`Channel: <#${channel.id}>`,
					"This channel's video quality mode was updated."
				])
				.addField("Old Video Quality Mode", `${!(oldChannel as Eris.OldGuildVoiceChannel).videoQualityMode ? "[NONE]" : (oldChannel as Eris.OldGuildVoiceChannel).videoQualityMode === Eris.Constants.VideoQualityModes.AUTO ? "Auto" : "Full"}`, false)
				.addField("New Video Quality Mode", channel.videoQualityMode === Eris.Constants.VideoQualityModes.AUTO ? "Auto" : "Full", false)
				.toJSON()
			);
		}

		if (oldChannel.name !== channel.name) embeds.push(new EmbedBuilder(true)
			.setTitle("Channel Updated")
			.setColor("gold")
			.setDescription([
				`Channel: <#${channel.id}>`,
				"This channel's name was updated."
			])
			.addField("Old Name", oldChannel.name, false)
			.addField("New Name", channel.name, false)
			.toJSON()
		);

		if (embeds.length === 0) continue;

		if (channel.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(channel.guild, "CHANNEL_UPDATE", (a) => a.targetID === channel.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Channel Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
