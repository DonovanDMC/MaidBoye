import ErrorHandler from "@util/handlers/ErrorHandler";
import { emojis, names } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris, { DiscordRESTError } from "eris";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import BotFunctions from "@util/BotFunctions";

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
		try {
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
								`${emojis.default.dot} Name: **${msg.channel.guild.name}**`,
								`${emojis.default.dot} Id: **${msg.channel.guild.id}**`,
								`${emojis.default.dot} Owner:** ${owner}**`,
								`${emojis.default.dot} Creation Date: **${BotFunctions.formatDiscordTime(msg.channel.guild.createdAt, "long-datetime", true)}**`,
								`${emojis.default.dot} Boosts: **${msg.channel.guild.premiumSubscriptionCount || "None"}**${!msg.channel.guild.premiumSubscriptionCount ? "" : ` (Tier: **${names.boostTier[msg.channel.guild.premiumTier]}**)`}`,
								`${emojis.default.dot} Large: **${msg.channel.guild.large ? "Yes" : "No"}**`,
								`${emojis.default.dot} Verification Level: **${names.verificationLevel[msg.channel.guild.verificationLevel]}**`,
								`${emojis.default.dot} 2FA Requirement: **${msg.channel.guild.mfaLevel === 0 ? "Disabled" : "Enabled"}**`,
								`${emojis.default.dot} Default Notifications: **${msg.channel.guild.defaultNotifications === 0 ? "All Messages" : "Only Mentions"}**`,
								`${emojis.default.dot} Vanity URL: **${msg.channel.guild.features.includes("VANITY_URL") && msg.channel.guild.vanityURL !== null ? `[https://discord.gg/${msg.channel.guild.vanityURL}](https://discord.gg/${msg.channel.guild.vanityURL})` : "None"}**`,
								`${emojis.default.dot} NSFW level: ${["Default", "Explicit", "Safe", "Age Restricted"][msg.channel.guild.nsfwLevel]}`,
								"",
								"**Features**:",
								msg.channel.guild.features.length === 0 ? `${emojis.default.dot} NONE` : msg.channel.guild.features.map(f => `${emojis.default.dot} ${names.serverFeatures[f as keyof typeof names["serverFeatures"]] ?? f}`)
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
								`${emojis.default.dot} Total: ${msg.channel.guild.memberCount}`,
								`${emojis.default.dot} ${emojis.custom.online}: ${msg.channel.guild.members.filter(m => m.status === "online").length}`,
								`${emojis.default.dot} ${emojis.custom.idle}: ${msg.channel.guild.members.filter(m => m.status === "idle").length}`,
								`${emojis.default.dot} ${emojis.custom.dnd}: ${msg.channel.guild.members.filter(m => m.status === "dnd").length}`,
								`${emojis.default.dot} ${emojis.custom.offline}: ${msg.channel.guild.members.filter(m => m.status === "offline").length}`,
								`${emojis.default.dot} Non-Bots: ${msg.channel.guild.members.filter(m => !m.bot).length}`,
								`${emojis.default.dot} Bots: ${msg.channel.guild.members.filter(m => m.bot).length}`
							)
							.setThumbnail(msg.channel.guild.iconURL ?? "")
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
						.toJSON()
				} as Eris.AdvancedMessageContent,
				channels: {
					embeds: [
						new EmbedBuilder()
							.setTitle(`Server Info - **${msg.channel.guild.name}**`)
							.setDescription(
								"**Channels**:",
								`${emojis.default.dot} Total: ${msg.channel.guild.channels.size}`,
								`${emojis.default.dot} Text: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_TEXT).length}`,
								`${emojis.default.dot} Voice: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_VOICE).length}`,
								`${emojis.default.dot} Category: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_CATEGORY).length}`,
								`${emojis.default.dot} News: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_NEWS).length}`,
								`${emojis.default.dot} Store: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STORE).length}`,
								`${emojis.default.dot} Stage: ${msg.channel.guild.channels.filter(c => c.type === Eris.Constants.ChannelTypes.GUILD_STAGE).length}`,
								"",
								`${emojis.default.dot} Hidden (For You): ${msg.channel.guild.channels.filter(c => !c.permissionsOf(msg.author.id).has("viewChannel")).length}`,
								`${emojis.default.dot} Visible (For You): ${msg.channel.guild.channels.filter(c => c.permissionsOf(msg.author.id).has("viewChannel")).length}`,
								"",
								`${emojis.default.dot} Hidden (For Me): ${msg.channel.guild.channels.filter(c => !c.permissionsOf(this.user.id).has("viewChannel")).length}`,
								`${emojis.default.dot} Visible (For Me): ${msg.channel.guild.channels.filter(c => c.permissionsOf(this.user.id).has("viewChannel")).length}`
							)
							.setThumbnail(msg.channel.guild.iconURL ?? "")
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
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
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
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
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
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
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `sinfo-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
						.toJSON()
				} as Eris.AdvancedMessageContent
			};

			let initialSection = msg.args.length === 0 ? "server" : msg.args[0].toLowerCase();
			if (!Object.keys(sections).includes(initialSection)) initialSection = "server";
			let m: Eris.Message<Eris.GuildTextableChannel> | undefined;
			async function waitForEdit(this: MaidBoye): Promise<void> {
				if (m === undefined) m = await msg.reply(sections[initialSection as keyof typeof sections]);
				const c = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channel.id === msg.channel.id && it.message.id === m!.id && it.data.custom_id.startsWith("sinfo") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);
				if (c === null) {
					await m.edit({
						embeds: m.embeds,
						components: []
					});
				} else {
					switch (c.data.custom_id.split(".")[0].split("-")[1]) {
						case "members": {
							await c.editParent(sections.members);
							break;
						}

						case "channels": {
							await c.editParent(sections.channels);
							break;
						}

						case "icon": {
							await c.editParent(sections.icon);
							break;
						}

						case "splash": {
							await c.editParent(sections.splash);
							break;
						}

						case "banner": {
							await c.editParent(sections.banner);
							break;
						}

						case "back": {
							await c.editParent(sections.server);
							break;
						}
					}

					return void waitForEdit.call(this);
				}
			}
			void waitForEdit.call(this);
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
