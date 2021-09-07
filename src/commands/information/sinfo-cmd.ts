import { emojis, names } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import BotFunctions from "@util/BotFunctions";

export async function generateSections(this: MaidBoye,guild: Eris.Guild, author: Eris.User) {
	const o = await this.getUser(guild.ownerID);
	const owner = o === null ? `Unknown#0000 (**${guild.ownerID}**)` : `**${o.username}#${o.discriminator}** (${o.id})`;

	return {
		// home
		server: {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Server Info - **${guild.name}**`)
					.setDescription(
						"**Server**:",
						`${emojis.default.dot} Name: **${guild.name}**`,
						`${emojis.default.dot} Id: **${guild.id}**`,
						`${emojis.default.dot} Owner: ${owner}`,
						`${emojis.default.dot} Creation Date: ${BotFunctions.formatDiscordTime(guild.createdAt, "long-datetime", true)}`,
						`${emojis.default.dot} Boosts: **${guild.premiumSubscriptionCount || "None"}**${!guild.premiumSubscriptionCount ? "" : ` (Tier: **${names.boostTier[guild.premiumTier]}**)`}`,
						`${emojis.default.dot} Large: **${guild.large ? "Yes" : "No"}**`,
						`${emojis.default.dot} Verification Level: **${names.verificationLevel[guild.verificationLevel]}**`,
						`${emojis.default.dot} 2FA Requirement: **${names.mfaLevel[guild.mfaLevel]}**`,
						`${emojis.default.dot} Explicit Content Filter: **${names.explicitContentFilter[guild.explicitContentFilter]}**`,
						`${emojis.default.dot} Default Notifications: **${names.defaultNotifications[guild.defaultNotifications]}**`,
						`${emojis.default.dot} Vanity URL: **${guild.features.includes("VANITY_URL") && guild.vanityURL !== null ? `[https://discord.gg/${guild.vanityURL}](https://discord.gg/${guild.vanityURL})` : "None"}**`,
						`${emojis.default.dot} NSFW level: ${names.nsfwLevel[guild.nsfwLevel]}`,
						"",
						"**Features**:",
						guild.features.length === 0 ? `${emojis.default.dot} NONE` : guild.features.map(f => `${emojis.default.dot} ${names.serverFeatures[f as keyof typeof names["serverFeatures"]] ?? f}`)
					)
					.setThumbnail(guild.iconURL ?? "")
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-members.${author.id}`, false, undefined, "Members")
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-channels.${author.id}`, false, undefined, "Channels")
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-icon.${author.id}`, false, undefined, "Icon")
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-splash.${author.id}`, false, undefined, "Splash")
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-banner.${author.id}`, false, undefined, "Banner")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent,
		members: {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Server Info - **${guild.name}**`)
					.setDescription(
						"(the below counts might be inaccurate)",
						"",
						"**Members**:",
						`${emojis.default.dot} Total: ${guild.memberCount}`,
						// we didn't ask for the presences intent
						`${emojis.default.dot} Non-Bots: ${guild.members.filter(m => !m.bot).length}`,
						`${emojis.default.dot} Bots: ${guild.members.filter(m => m.bot).length}`
					)
					.setThumbnail(guild.iconURL ?? "")
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent,
		channels: {
			embeds: [
				new EmbedBuilder()
					.setTitle(`Server Info - **${guild.name}**`)
					.setDescription(
						"**Channels**:",
						`${emojis.default.dot} Total: ${guild.channels.size}`,
						`${emojis.default.dot} Text: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_TEXT).length}`,
						`${emojis.default.dot} Voice: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_VOICE).length}`,
						`${emojis.default.dot} Category: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_CATEGORY).length}`,
						`${emojis.default.dot} News: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_NEWS).length}`,
						`${emojis.default.dot} Store: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STORE).length}`,
						`${emojis.default.dot} Stage: ${guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STAGE).length}`,
						"",
						`${emojis.default.dot} Hidden (For You): ${guild.channels.filter(c => !c.permissionsOf(author.id).has("viewChannel")).length}`,
						`${emojis.default.dot} Visible (For You): ${guild.channels.filter(c => c.permissionsOf(author.id).has("viewChannel")).length}`,
						"",
						`${emojis.default.dot} Hidden (For Me): ${guild.channels.filter(c => !c.permissionsOf(this.user.id).has("viewChannel")).length}`,
						`${emojis.default.dot} Visible (For Me): ${guild.channels.filter(c => c.permissionsOf(this.user.id).has("viewChannel")).length}`
					)
					.setThumbnail(guild.iconURL ?? "")
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent,
		icon: {
			embeds: [
				(
					guild.iconURL === null ?
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setDescription("This server does not have an icon.")
						:
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setImage(guild.iconURL)
							.setDescription(
								"**Icon**:",
								`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${guild.iconURL!.split("?")[0]}?size=${size})`).join("  ")}`
							)
				).toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent,
		splash: {
			embeds: [
				(
					guild.splashURL === null ?
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setDescription("This server does not have an invite splash.")
						:
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setImage(guild.splashURL)
							.setDescription(
								"**Invite Splash**:",
								`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${guild.splashURL!.split("?")[0]}?size=${size})`).join("  ")}`
							)
				).toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent,
		banner: {
			embeds: [
				(
					guild.bannerURL === null ?
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setDescription("This server does not have an invite banner.")
						:
						new EmbedBuilder()
							.setTitle(`Server Info - **${guild.name}**`)
							.setImage(guild.bannerURL)
							.setDescription(
								"**Invite Banner**:",
								`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${guild.bannerURL!.split("?")[0]}?size=${size})`).join("  ")}`
							)
				).toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${author.id}`, false, undefined, "Exit")
				.toJSON()
		} as Eris.AdvancedMessageContent
	};
}
export default new Command("sinfo", "serverinfo")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get some info about this server")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "section",
			description: "The section of info to get.",
			required: false,
			choices: [
				{
					name: "Server",
					value: "server"
				},
				{
					name: "Members",
					value: "members"
				},
				{
					name: "Channels",
					value: "channels"
				},
				{
					name: "Icon",
					value: "icon"
				},
				{
					name: "Splash",
					value: "splash"
				},
				{
					name: "Banner",
					value: "banner"
				}
			]
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		// most of this is handled in the top function, or events/components/information/sinfo.ts
		const sections = await generateSections.call(this, msg.channel.guild, msg.author);
		let initialSection = msg.args.length === 0 ? "server" : msg.args[0].toLowerCase();
		if (!Object.keys(sections).includes(initialSection)) initialSection = "server";
		await msg.reply(sections[initialSection as keyof typeof sections]);
	});
