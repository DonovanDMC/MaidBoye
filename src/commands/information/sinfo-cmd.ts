import config from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import BotFunctions from "@util/BotFunctions";

export default new Command("sinfo", "serverinfo")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get some info about this server")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const o = await this.getUser(msg.channel.guild.ownerID);
		const owner = o === null ? `Unknown#0000 (${msg.channel.guild.ownerID})` : `${o.username}#${o.discriminator} (${o.id})`;

		const sections = {
			// home
			server: {
				embeds: [
					new EmbedBuilder()
						.setTitle(`Server Info - **${msg.channel.guild.name}**`)
						.setDescription(
							"**Server**:",
							`${config.emojis.default.dot} Name: **${msg.channel.guild.name}**`,
							`${config.emojis.default.dot} Id: **${msg.channel.guild.id}**`,
							`${config.emojis.default.dot} Owner:** ${owner}**`,
							`${config.emojis.default.dot} Creation Date: **${BotFunctions.formatDiscordTime(msg.channel.guild.createdAt, "long-datetime", true)}**`,
							`${config.emojis.default.dot} Boosts: **${msg.channel.guild.premiumSubscriptionCount || "None"}**${!msg.channel.guild.premiumSubscriptionCount ? "" : ` (Tier: **${config.names.boostTier[msg.channel.guild.premiumTier]}**)`}`,
							`${config.emojis.default.dot} Large: **${msg.channel.guild.large ? "Yes" : "No"}**`,
							`${config.emojis.default.dot} Verification Level: **${config.names.verificationLevel[msg.channel.guild.verificationLevel]}**`,
							`${config.emojis.default.dot} 2FA Requirement: **${msg.channel.guild.mfaLevel === 0 ? "Disabled" : "Enabled"}**`,
							`${config.emojis.default.dot} Default Notifications: **${msg.channel.guild.defaultNotifications === 0 ? "All Messages" : "Only Mentions"}**`,
							`${config.emojis.default.dot} Vanity URL: **${msg.channel.guild.features.includes("VANITY_URL") && msg.channel.guild.vanityURL !== null ? `[https://discord.gg/${msg.channel.guild.vanityURL}](https://discord.gg/${msg.channel.guild.vanityURL})` : "None"}**`,
							`${config.emojis.default.dot} NSFW level: ${["Default", "Explicit", "Safe", "Age Restricted"][msg.channel.guild.nsfwLevel]}`,
							"",
							"**Features**:",
							msg.channel.guild.features.length === 0 ? `${config.emojis.default.dot} NONE` : msg.channel.guild.features.map(f => `${config.emojis.default.dot} ${config.names.serverFeatures[f as keyof typeof config["names"]["serverFeatures"]] ?? f}`)
						)
						.setThumbnail(msg.channel.guild.iconURL ?? "")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-members.${msg.author.id}`, false, undefined, "Members")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-channels.${msg.author.id}`, false, undefined, "Channels")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-icon.${msg.author.id}`, false, undefined, "Icon")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-splash.${msg.author.id}`, false, undefined, "Splash")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-banner.${msg.author.id}`, false, undefined, "Banner")
					.toJSON()
			} as Eris.AdvancedMessageContent,
			members: {
				embeds: [
					new EmbedBuilder()
						.setTitle(`Server Info - **${msg.channel.guild.name}**`)
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
						.setThumbnail(msg.channel.guild.iconURL ?? "")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.toJSON()
			} as Eris.AdvancedMessageContent,
			channels: {
				embeds: [
					new EmbedBuilder()
						.setTitle(`Server Info - **${msg.channel.guild.name}**`)
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
						.setThumbnail(msg.channel.guild.iconURL ?? "")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.toJSON()
			} as Eris.AdvancedMessageContent,
			icon: {
				embeds: [
					(
						msg.channel.guild.iconURL === null ?
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setDescription("This server does not have an icon.")
							:
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setImage(msg.channel.guild.iconURL)
								.setDescription(
									"**Icon**:",
									`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.iconURL!.split("?")[0]}?size=${size})`).join("  ")}`
								)
					).toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.toJSON()
			} as Eris.AdvancedMessageContent,
			splash: {
				embeds: [
					(
						msg.channel.guild.splashURL === null ?
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setDescription("This server does not have an invite splash.")
							:
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setImage(msg.channel.guild.splashURL)
								.setDescription(
									"**Invite Splash**:",
									`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.splashURL!.split("?")[0]}?size=${size})`).join("  ")}`
								)
					).toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.toJSON()
			} as Eris.AdvancedMessageContent,
			banner: {
				embeds: [
					(
						msg.channel.guild.bannerURL === null ?
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setDescription("This server does not have an invite banner.")
							:
							new EmbedBuilder()
								.setTitle(`Server Info - **${msg.channel.guild.name}**`)
								.setImage(msg.channel.guild.bannerURL)
								.setDescription(
									"**Invite Banner**:",
									`${[512, 1024, 2048, 4096].map(size => `[[${size}]](${msg.channel.guild.bannerURL!.split("?")[0]}?size=${size})`).join("  ")}`
								)
					).toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.toJSON()
			} as Eris.AdvancedMessageContent
		};

		let m: Eris.Message<Eris.GuildTextableChannel> | undefined;
		async function waitForEdit(this: MaidBoye): Promise<void> {
			if (m === undefined) m = await msg.reply(sections.server);
			const c = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channel_id === msg.channel.id && it.message.id === m!.id && it.data.custom_id.startsWith("sinfo") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);
			if (c === null) {
				await m.edit({
					embeds: m.embeds,
					components: []
				});
				clearTimeout(t);
			} else {
				switch (c.data.custom_id.split(".")[0]) {
					case "sinfo-members": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.members);
						break;
					}

					case "sinfo-channels": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.channels);
						break;
					}

					case "sinfo-icon": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.icon);
						break;
					}

					case "sinfo-splash": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.splash);
						break;
					}

					case "sinfo-banner": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.banner);
						break;
					}

					case "sinfo-back": {
						await this.createInteractionResponse(c.id, c.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, sections.server);
						break;
					}
				}

				return waitForEdit.call(this);
			}
		}

		const t = setTimeout(() => {
			if (m !== undefined) void m.edit({
				embeds: m.embeds,
				components: []
			});
		}, 9e5);

		void waitForEdit.call(this);
	});
