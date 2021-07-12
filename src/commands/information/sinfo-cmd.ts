import config from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import Eris from "eris";

export default new Command("sinfo", "serverinfo")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get some info about this server")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const o = await this.getUser(msg.channel.guild.ownerID);
		const owner = o === null ? `Unknown#0000 (${msg.channel.guild.ownerID})` : `${o.username}#${o.discriminator} (${o.id})`;

		const embed = new EmbedBuilder().setTitle(`Server Info - **${msg.channel.guild.name}**`);

		const sect = msg.args.length === 0 ? null : msg.args[0].toLowerCase();
		switch (sect ?? "server") {
			case "server": {
				embed
					.setDescription(
						"**Server**:",
						`${config.emojis.default.dot} Name: **${msg.channel.guild.name}**`,
						`${config.emojis.default.dot} Id: **${msg.channel.guild.id}**`,
						`${config.emojis.default.dot} Owner:** ${owner}**`,
						`${config.emojis.default.dot} Creation Date: **${Time.formatDateWithPadding(msg.channel.guild.createdAt, true)}**`,
						`${config.emojis.default.dot} Boosts: **${msg.channel.guild.premiumSubscriptionCount || "None"}**${!msg.channel.guild.premiumSubscriptionCount ? "" : ` (Tier: **${config.names.boostTier[msg.channel.guild.premiumTier]}**)`}`,
						`${config.emojis.default.dot} Large: **${msg.channel.guild.large ? "Yes" : "No"}**`,
						`${config.emojis.default.dot} Verification Level: **${config.names.verificationLevel[msg.channel.guild.verificationLevel]}**`,
						`${config.emojis.default.dot} 2FA Requirement: **${msg.channel.guild.mfaLevel === 0 ? "Disabled" : "Enabled"}**`,
						`${config.emojis.default.dot} Default Notifications: **${msg.channel.guild.defaultNotifications === 0 ? "All Messages" : "Only Mentions"}**`,
						`${config.emojis.default.dot} Vanity URL: **${msg.channel.guild.features.includes("VANITY_URL") && msg.channel.guild.vanityURL !== null ? `[https://discord.gg/${msg.channel.guild.vanityURL}](https://discord.gg/${msg.channel.guild.vanityURL})` : "None"}**`,
						`${config.emojis.default.dot} NSFW level: ${["Default", "Explicit", "Safe", "Age Restricted"][msg.channel.guild.nsfwLevel]}`,
						"",
						"**Features**:",
						msg.channel.guild.features.length === 0 ? `${config.emojis.default.dot} NONE` : msg.channel.guild.features.map(f => `${config.emojis.default.dot} ${config.names.serverFeatures[f as keyof typeof config["names"]["serverFeatures"]] ?? f}`),
						...(sect === null ? [
							"",
							`You can provide help to see the other possible sections. (e.g. \`${msg.gConfig.getFormattedPrefix(0)}sinfo help\`)`
						] : [])
					)
					.setThumbnail(msg.channel.guild.iconURL ?? "");
				break;
			}
			case "members": {
				embed
					.setDescription(
						"(the below counts will almost certainly be inaccurate)",
						"",
						"**Members**:",
						`${config.emojis.default .dot} Total: ${msg.channel.guild.memberCount}`,
						`${config.emojis.default .dot} ${config.emojis.custom.online}: ${msg.channel.guild.members.filter(m => m.status === "online").length}`,
						`${config.emojis.default .dot} ${config.emojis.custom.idle}: ${msg.channel.guild.members.filter(m => m.status === "idle").length}`,
						`${config.emojis.default .dot} ${config.emojis.custom.dnd}: ${msg.channel.guild.members.filter(m => m.status === "dnd").length}`,
						`${config.emojis.default .dot} ${config.emojis.custom.offline}: ${msg.channel.guild.members.filter(m => m.status === "offline").length}`,
						`${config.emojis.default .dot} Non-Bots: ${msg.channel.guild.members.filter(m => !m.bot).length}`,
						`${config.emojis.default .dot} Bots: ${msg.channel.guild.members.filter(m => m.bot).length}`
					)
					.setThumbnail(msg.channel.guild.iconURL!);
				break;
			}

			case "channels": {
				embed
					.setDescription(
						"**Channels**:",
						`${config.emojis.default .dot} Total: ${msg.channel.guild.channels.size}`,
						`${config.emojis.default .dot} Text: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_TEXT).length}`,
						`${config.emojis.default .dot} Voice: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_VOICE).length}`,
						`${config.emojis.default .dot} Category: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_CATEGORY).length}`,
						`${config.emojis.default .dot} News: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_NEWS).length}`,
						`${config.emojis.default .dot} Store: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STORE).length}`,
						`${config.emojis.default .dot} Stage: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STAGE).length}`,
						"",
						`${config.emojis.default .dot} Hidden (For You): ${msg.channel.guild.channels.filter(c => !c.permissionsOf(msg.author.id).has("viewChannel")).length}`,
						`${config.emojis.default .dot} Visible (For You): ${msg.channel.guild.channels.filter(c => c.permissionsOf(msg.author.id).has("viewChannel")).length}`,
						"",
						`${config.emojis.default .dot} Hidden (For Me): ${msg.channel.guild.channels.filter(c => !c.permissionsOf(this.user.id).has("viewChannel")).length}`,
						`${config.emojis.default .dot} Visible (For Me): ${msg.channel.guild.channels.filter(c => c.permissionsOf(this.user.id).has("viewChannel")).length}`
					)
					.setThumbnail(msg.channel.guild.iconURL!);
				break;

			}

			case "icon": {
				if (msg.channel.guild.iconURL === null) return msg.reply("Th-this server doesn't have an icon..");
				embed
					.setImage(msg.channel.guild.iconURL)
					.setDescription(
						"**Icon**:",
						`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.iconURL!.split("?")[0]}?size=${size})`).join("  ")}`
					);
				break;
			}

			case "splash": {
				if (msg.channel.guild.splashURL === null) return msg.reply("Th-this server doesn't have a splash..");
				embed
					.setImage(msg.channel.guild.splashURL)
					.setDescription(
						"**Invite Splash**:",
						`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.splashURL!.split("?")[0]}?size=${size})`).join("  ")}`
					);
				break;
			}

			case "banner": {
				if (msg.channel.guild.bannerURL === null) return msg.reply("Th-this server doesn't have a banner..");
				embed
					.setImage(msg.channel.guild.bannerURL)
					.setDescription(
						"**Invite Banner**:",
						`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.bannerURL!.split("?")[0]}?size=${size})`).join("  ")}`
					);
				break;
			}

			case "help": {
				embed.setDescription(
					`**Server**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo server\``,
					`**Members**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo members\``,
					`**Channel**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo channels\``,
					`**Icon**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo icon\``,
					`**Banner**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo banner\``,
					`**Invite Splash**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo splash\``,
					`**Help**: \`${msg.gConfig.getFormattedPrefix(0)}sinfo help\``
				);
				break;
			}

			default: {
				return msg.reply(`Th-that wasn't a valid section.. Use \`${msg.gConfig.getFormattedPrefix(0)}sinfo help\` if you need help.`);
			}
		}
		return msg.channel.createMessage({
			embeds: [
				embed.toJSON()
			]
		});
	});
