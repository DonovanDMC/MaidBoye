/* eslint-disable @typescript-eslint/no-unused-vars */
import ExtendedMessage from "./ExtendedMessage";
import EmbedBuilder from "./EmbedBuilder";
import ComponentHelper from "./ComponentHelper";
import { emojis, yiffTypes } from "@config";
import Eris from "eris";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import { Strings } from "@uwu-codes/utils";

async function duplicate(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>, name: string, value: string) {
	await botMessage.edit({
		content: "",
		embeds: [
			new EmbedBuilder(true, originalMessage.author)
				.setTitle(`Server Settings: ${name}`)
				.setDescription(`**${name}** is already set to ${value}.`)
				.setColor("red")
				.toJSON()
		],
		components: new ComponentHelper()
			.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
			.addInteractionButton(ComponentHelper.BUTTON_DANGER, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
			.toJSON()
	});
	const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
	if (wait === null) {
		await  botMessage.edit({
			content: "Timeout detected, menu closed.",
			embeds: [],
			components: []
		});
		return false;
	} else {
		await wait.acknowledge();
		if (wait.data.custom_id.includes("back")) return true;
		else return false;
	}
}

export type ExecReturn = [keepGoing: true, wait: boolean] | [keepGoing: false, wait: false];

const Settings = [
	{
		name: "Default Yiff Type",
		description: "The default yiff type in the `yiff` command.",
		shortDescription: null,
		validValuesDescription: yiffTypes.map(v => `\`${v}\``).join(", "),
		emoji: {
			// sauce: https://e621.net/posts/270632
			// sauce[nsfw]: https://e621.net/posts/2808962
			value: emojis.custom.yiff,
			type: "custom" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.defaultYiffType}\``; },
		validator(val: string, message: ExtendedMessage) { return yiffTypes.includes(val.toLowerCase() as "gay"); },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addSelectMenu(`settings-select.${originalMessage.author.id}`, yiffTypes.map(t => ({
						label: Strings.ucwords(t),
						value: t,
						emoji: emojis.custom[t as "gay"] === undefined ? ComponentHelper.emojiToPartial(emojis.default.question, "default") : ComponentHelper.emojiToPartial(emojis.custom[t as "gay"], "custom")
					})), "Select An Option", 1, 1)
					.toJSON()
			});

			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = !wait.data || !("values" in wait.data) ? null : wait.data.values[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if (originalMessage.gConfig.settings.defaultYiffType === v) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.defaultYiffType);
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}

				await originalMessage.gConfig.edit({
					settings: {
						defaultYiffType: v as GuildConfig["settings"]["defaultYiffType"]
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "E621 Thumbnail Type",
		description: "The thumbnail type for webm posts in the `e621` command.",
		// because the select menu max is 50
		shortDescription: "The thumbnail type for e621 webm posts.",
		validValuesDescription: "`gif`, `image`, `none`",
		emoji: {
			value: emojis.custom.thumb,
			type: "custom" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.e621ThumbnailType}\``; },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addSelectMenu(`settings-select.${originalMessage.author.id}`, [
						{
							label: "Gif",
							value: "gif",
							emoji: ComponentHelper.emojiToPartial(emojis.custom.gif, "custom")
						},
						{
							label: "Image",
							value: "image",
							emoji: ComponentHelper.emojiToPartial(emojis.custom.thumb, "custom")
						},
						{
							label: "None",
							value: "none",
							emoji: ComponentHelper.emojiToPartial(emojis.default.none, "default")
						}
					], "Select An Option", 1, 1)
					.toJSON()
			});
			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = !wait.data || !("values" in wait.data) ? null : wait.data.values[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if (originalMessage.gConfig.settings.e621ThumbnailType === v) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.e621ThumbnailType);
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						e621ThumbnailType: v as GuildConfig["settings"]["e621ThumbnailType"]
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "Mute Role",
		description: "The role to use for muting people.",
		shortDescription: null,
		validValuesDescription: "any role lower than me",
		emoji: {
			value: emojis.default.mute,
			type: "default" as const
		},
		displayFormat(guild: GuildConfig) { return guild.settings.muteRole === null ? "`None`" : `<@&${guild.settings.muteRole}>`; },
		validator(val: string, message: ExtendedMessage) {
			if (val === "reset") return true;
			const [id = null] = /^(?:<@&)?([\d]{15,21})>?$/.exec(val) ?? [];
			return id === null ? false : message.channel.guild.roles.has(id);
		},
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				content: "",
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below, or send a role.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-reset.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Reset (No Mute Role)")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.toJSON()
			});

			const role = await new Promise<ExecReturn | Eris.Role>(resolve => {
				let resolved = false;
				void originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id)
					.then(async(wait) => {
						if (resolved === true) return;
						if (wait !== null) {
							await wait.acknowledge();
							resolved = true;
							if (wait.data.custom_id.includes("reset")) {
								await botMessage.edit({
									content: "The mute role has been reset. Returning to menu in 3 seconds..",
									embeds: [],
									components: []
								});
								resolve([true, true]);
							} else if (wait.data.custom_id.includes("back")) {
								await botMessage.edit(b);
								resolve([true, false]);
							} else {
								await botMessage.edit({
									content: "",
									components: []
								});
								resolve([false, false]);
							}
						}
					});

				void originalMessage.channel.awaitMessages(6e4, (m) => m.author.id === originalMessage.author.id)
					.then(async(res) => {
						if (resolved === true) return;
						if (res !== null) {
							resolved = true;
							const r = await res.getRoleFromArgs();
							if (r === null) {
								await botMessage.edit({
									content: "",
									embeds: [
										new EmbedBuilder(true, originalMessage.author)
											.setTitle(`Server Settings: ${this.name}`)
											.setDescription("Invalid role specified.")
											.toJSON()
									],
									components: []
								});
								resolve([false, false]);
							} else resolve(r);
						}
					});

				setTimeout(async() => {
					resolved = true;
					await botMessage.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, originalMessage.author)
								.setTitle("Server Settings")
								.setDescription("Exited.")
								.toJSON()
						],
						components: []
					});
					resolve([false, false]);
				}, 6.15e4);
			});

			if (Array.isArray(role)) return role;
			if (role.compareToMember(originalMessage.channel.guild.me) !== "lower") {
				await botMessage.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, originalMessage.author)
							.setTitle(`Server Settings: ${this.name}`)
							.setDescription("The specified role is as high as, or higher than my top role. I cannot assign it.")
							.toJSON()
					],
					components: []
				});
				return [false, false];
			} else {
				if (originalMessage.gConfig.settings.muteRole === role.id) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.e621ThumbnailType);
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						muteRole: role.id
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to <@&${role.id}>. Consider using \`${originalMessage.gConfig.getFormattedPrefix()}setup-mutes\` to setup the proper permissions. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "Command Images",
		description: "if we should display images on some `fun` commands",
		shortDescription: null,
		validValuesDescription: "`enabled` or `disabled`",
		emoji: {
			value: emojis.custom.thumb,
			type: "custom" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.commandImages ? "Enabled" : "Disabled"}\``; },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-enabled.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.greenTick, "custom"), "Enabled")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-disabled.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.redTick, "custom"), "Disabled")
					.toJSON()
			});
			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = wait.data.custom_id.split("-")[1].split(".")[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if ((originalMessage.gConfig.settings.commandImages === false && v === "disabled") || (originalMessage.gConfig.settings.commandImages === true && v === "enabled")) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.commandImages ? "Enabled" : "Disabled");
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						commandImages: v === "enabled" ? true : false
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "Delete Mod Commands",
		description: "if moderation invocations should be deleted",
		shortDescription: null,
		validValuesDescription: "`yes` or `no`",
		emoji: {
			value: emojis.default.pencil,
			type: "default" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.deleteModCommands ? "Yes" : "No"}\``; },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				content: "",
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-yes.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.greenTick, "custom"), "Yes")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-no.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.redTick, "custom"), "No")
					.toJSON()
			});
			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = wait.data.custom_id.split("-")[1].split(".")[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if ((originalMessage.gConfig.settings.deleteModCommands === false && v === "no") || (originalMessage.gConfig.settings.deleteModCommands === true && v === "yes")) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.deleteModCommands ? "Yes" : "No");
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}

				if (v === "yes" && !originalMessage.channel.guild.permissionsOf(originalMessage.client.user.id).has("manageMessages")) {
					await botMessage.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, originalMessage.author)
								.setTitle("Server Settings")
								.setDescription(`I need the **Manage Messages** permission to change **${this.name}** to **yes**.`)
								.toJSON()
						],
						components: []
					});
					return [false, false];
				}

				await originalMessage.gConfig.edit({
					settings: {
						deleteModCommands: v === "yes" ? true : false
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "Snipes Disabled",
		description: "if snipe/editsnipe should be disabled",
		shortDescription: null,
		validValuesDescription: "`yes` or `no`",
		emoji: {
			value: emojis.default.pencil,
			type: "default" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.snipeDisabled ? "Yes" : "No"}\``; },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-yes.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.greenTick, "custom"), "Yes")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-no.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.redTick, "custom"), "No")
					.toJSON()
			});
			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = wait.data.custom_id.split("-")[1].split(".")[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if ((originalMessage.gConfig.settings.snipeDisabled === false && v === "no") || (originalMessage.gConfig.settings.snipeDisabled === true && v === "yes")) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.snipeDisabled ? "Yes" : "No");
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						snipeDisabled: v === "yes" ? true : false
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	},
	{
		name: "Level Up Announcements",
		description: "if level ups should be announced (in channel)",
		shortDescription: null,
		validValuesDescription: "`yes` or `no`",
		emoji: {
			value: emojis.default.pencil,
			type: "default" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings.announceLevelUp ? "Yes" : "No"}\``; },
		async exec(originalMessage: ExtendedMessage, botMessage: Eris.Message<Eris.GuildTextableChannel>): Promise<ExecReturn> {
			const b = JSON.parse<Eris.AdvancedMessageContent>(JSON.stringify({ embeds: botMessage.embeds, components: botMessage.components }));
			await botMessage.edit({
				embeds: [
					new EmbedBuilder(true, originalMessage.author)
						.setTitle(`Server Settings: ${this.name}`)
						.setDescription("Please select an option from below.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.x, "default"), "Exit")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-yes.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.greenTick, "custom"), "Yes")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-no.${originalMessage.author.id}`, false, ComponentHelper.emojiToPartial(emojis.custom.redTick, "custom"), "No")
					.toJSON()
			});
			const wait = await originalMessage.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member!.user.id === originalMessage.author.id && it.message.id === botMessage.id);
			if (wait === null) {
				await botMessage.edit({
					content: "",
					components: []
				});
				return [false, false];
			} else {
				const v = wait.data.custom_id.split("-")[1].split(".")[0];
				await wait.acknowledge();
				if (v === null) {
					if (wait.data.custom_id.includes("back")) {
						await botMessage.edit(b);
						return [true, false];
					} else {
						await botMessage.edit({
							content: "",
							components: []
						});
						return [false, false];
					}
				}

				if ((originalMessage.gConfig.settings.announceLevelUp === false && v === "no") || (originalMessage.gConfig.settings.announceLevelUp === true && v === "yes")) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings.announceLevelUp ? "Yes" : "No");
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						announceLevelUp: v === "yes" ? true : false
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		}
	}
];
export default Settings;

Settings.forEach(s => {
	if ((s.shortDescription !== null && s.shortDescription.length > 50) || (s.shortDescription === null && s.description.length > 50)) throw new Error(`shortDescription for setting "${s.name}" is longer than 50 characters.`);
});
