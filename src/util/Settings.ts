import type ExtendedMessage from "./ExtendedMessage";
import EmbedBuilder from "./EmbedBuilder";
import ComponentHelper from "./components/ComponentHelper";
import { emojis, yiffTypes } from "@config";
import Eris from "eris";
import type GuildConfig from "@models/Guild/GuildConfig";
import { Strings } from "@uwu-codes/utils";
import db from "@db";

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
export const slashify = (str: string) => str.toLowerCase().replace(/\s/g, "-");

function genericBoolean(name: string, dbName: keyof GuildConfig["settings"], description: string, shortDescription: string | null, type: 0 | 1, emojiValue: string, emojiType: "default" | "custom") {
	return {
		name,
		dbName,
		description,
		shortDescription,
		validValuesDescription: type === 0 ? "`yes` or `no`" : "`enabled` or `disabled`",
		emoji: {
			value: emojiValue,
			type: emojiType
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings[this.dbName] ? (type === 0 ? "Yes" : "Enabled") : (type === 0 ? "No" : "Disabled")}\``; },
		get slashCommandOptions() {
			return [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "value",
					description: "The option value.",
					choices: type === 0 ? [
						{
							name: "Yes",
							value: "yes"
						},
						{
							name: "No",
							value: "no"
						}
					] : [
						{
							name: "Enabled",
							value: "enabled"
						},
						{
							name: "Disabled",
							value: "disabled"
						}
					],
					required: true

				}
			] as Array<Eris.ApplicationCommandOptionsStringWithoutAutocomplete>;
		},
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

				if ((originalMessage.gConfig.settings[this.dbName] === false && v === "no") || (originalMessage.gConfig.settings.snipeDisabled === true && v === "yes")) {
					const dup = await duplicate(originalMessage, botMessage, this.name, originalMessage.gConfig.settings[this.dbName] ? "Yes" : "No");
					if (dup === true) {
						await botMessage.edit(b);
						return [true, false];
					}
					return [false, false];
				}
				await originalMessage.gConfig.edit({
					settings: {
						[this.dbName]: v === "yes"
					}
				});
				await botMessage.edit({
					content: `**${this.name}** has been updated to \`${v}\`. Returning to menu in 3 seconds..`,
					embeds: b.embeds,
					components: b.components
				});
				return [true, true];
			}
		},
		async execSlash(interaction: Eris.CommandInteraction) {
			if (!interaction.guildID || !interaction.member || interaction.data.options === undefined || interaction.data.options.length === 0) return;
			const main = interaction.data.options.find(o => o.name === slashify(this.name)) as Eris.InteractionDataOptionsSubCommand;
			if (!main || main.options === undefined || main.options.length === 0) return;
			const t = main.options.find(o => o.name === "value");
			if (!t || t.type !== Eris.Constants.ApplicationCommandOptionTypes.STRING) return;
			const gConfig = await db.getGuild(interaction.guildID);
			if (gConfig.settings[this.dbName] === (["enabled", "yes"].includes(t.value))) return interaction.createMessage(`H-hey! **${this.name}** is already set to \`${Strings.ucwords(t.value)}\`..`);
			await gConfig.edit({
				settings: {
					[this.dbName]: ["enabled", "yes"].includes(t.value)
				}
			});
			return interaction.createMessage(`**${this.name}** was updated to \`${Strings.ucwords(t.value)}\`.`);
		}
	};
}

const Settings = [
	{
		name: "Default Yiff Type",
		dbName: "defaultYiffType" as const,
		description: "The default yiff type in the `yiff` command.",
		shortDescription: null,
		validValuesDescription: yiffTypes.map(v => `\`${v}\``).join(", "),
		emoji: {
			// sauce: https://e621.net/posts/270632
			// sauce[nsfw]: https://e621.net/posts/2808962
			value: emojis.custom.yiff,
			type: "custom" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings[this.dbName]}\``; },
		get slashCommandOptions() {
			return [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "type",
					description: "The default yiff type.",
					choices: yiffTypes.map(t => ({
						name: Strings.ucwords(t),
						value: t
					})),
					required: true

				}
			] as Array<Eris.ApplicationCommandOptionsStringWithoutAutocomplete>;
		},
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
		},
		async execSlash(interaction: Eris.CommandInteraction) {
			if (!interaction.guildID || !interaction.member || interaction.data.options === undefined || interaction.data.options.length === 0) return;
			const main = interaction.data.options.find(o => o.name === slashify(this.name)) as Eris.InteractionDataOptionsSubCommand;
			if (!main || main.options === undefined || main.options.length === 0) return;
			const type = main.options.find(o => o.name === "type");
			if (!type || type.type !== Eris.Constants.ApplicationCommandOptionTypes.STRING) return;
			const gConfig = await db.getGuild(interaction.guildID);
			if (gConfig.settings.defaultYiffType === type.value) return interaction.createMessage(`H-hey! **${this.name}** is already set to \`${Strings.ucwords(type.value)}\`..`);
			await gConfig.edit({
				settings: {
					defaultYiffType: type.value as GuildConfig["settings"]["defaultYiffType"]
				}
			});
			return interaction.createMessage(`**${this.name}** was updated to \`${Strings.ucwords(type.value)}\`.`);
		}
	},
	{
		name: "E621 Thumbnail Type",
		dbName: "e621ThumbnailType" as const,
		description: "The thumbnail type for webm posts in the `e621` command.",
		// because the select menu max is 50
		shortDescription: "The thumbnail type for e621 webm posts.",
		validValuesDescription: "`gif`, `image`, `none`",
		emoji: {
			value: emojis.custom.thumb,
			type: "custom" as const
		},
		displayFormat(guild: GuildConfig) { return `\`${guild.settings[this.dbName]}\``; },
		get slashCommandOptions() {
			return [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "type",
					description: "The thumbnail type.",
					choices: [
						{
							name: "Gif",
							value: "gif"
						},
						{
							name: "Image",
							value: "image"
						},
						{
							name: "None",
							value: "none"
						}
					],
					required: true
				}
			] as Array<Eris.ApplicationCommandOptionsStringWithoutAutocomplete>;
		},
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
		},
		async execSlash(interaction: Eris.CommandInteraction) {
			if (!interaction.guildID || !interaction.member || interaction.data.options === undefined || interaction.data.options.length === 0) return;
			const main = interaction.data.options.find(o => o.name === slashify(this.name)) as Eris.InteractionDataOptionsSubCommand;
			if (!main || main.options === undefined || main.options.length === 0) return;
			const type = main.options.find(o => o.name === "type");
			if (!type || type.type !== Eris.Constants.ApplicationCommandOptionTypes.STRING) return;
			const gConfig = await db.getGuild(interaction.guildID);
			if (gConfig.settings.e621ThumbnailType === type.value) return interaction.createMessage(`H-hey! **${this.name}** is already set to \`${Strings.ucwords(type.value)}\`..`);
			await gConfig.edit({
				settings: {
					e621ThumbnailType: type.value as GuildConfig["settings"]["e621ThumbnailType"]
				}
			});
			return interaction.createMessage(`**${this.name}** was updated to \`${Strings.ucwords(type.value)}\`.`);
		}
	},
	{
		name: "Mute Role",
		dbName: "muteRole" as const,
		description: "The role to use for muting people.",
		shortDescription: null,
		validValuesDescription: "any role lower than me",
		emoji: {
			value: emojis.default.mute,
			type: "default" as const
		},
		displayFormat(guild: GuildConfig) { return guild.settings[this.dbName] === null ? "`None`" : `<@&${guild.settings[this.dbName]!}>`; },
		get slashCommandOptions() {
			return [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.ROLE,
					name: "role",
					description: "The role to use for mutes.",
					required: true
				}
			] as Array<Eris.ApplicationCommandOptionsRole>;
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
		},
		async execSlash(interaction: Eris.CommandInteraction) {
			if (!interaction.guildID || !interaction.member || interaction.data.options === undefined || interaction.data.options.length === 0) return;
			const main = interaction.data.options.find(o => o.name === slashify(this.name)) as Eris.InteractionDataOptionsSubCommand;
			if (!main || main.options === undefined || main.options.length === 0) return;
			const type = main.options.find(o => o.name === "role");
			if (!type || type.type !== Eris.Constants.ApplicationCommandOptionTypes.ROLE) return;
			const gConfig = await db.getGuild(interaction.guildID);
			if (gConfig.settings.muteRole === type.value) return interaction.createMessage({
				content: `H-hey! **${this.name}** is already set to \`${type.value}\`..`,
				allowedMentions: {
					roles: false
				}
			});
			await gConfig.edit({
				settings: {
					muteRole: type.value
				}
			});
			return interaction.createMessage({
				content: `**${this.name}** was updated to <@&${type.value}>.`,
				allowedMentions: {
					roles: false
				}
			});
		}
	},
	genericBoolean(
		"Command Images",
		"commandImages",
		"if we should display images on some `fun` commands",
		null,
		0,
		emojis.custom.thumb,
		"custom"
	),
	genericBoolean(
		"Delete Mod Commands",
		"deleteModCommands",
		"if moderation invocations should be deleted",
		null,
		1,
		emojis.default.pencil,
		"default"
	),
	genericBoolean(
		"Snipes Disabled",
		"snipeDisabled",
		"if snipe/editsnipe should be disabled",
		null,
		0,
		emojis.default.pencil,
		"default"
	),
	genericBoolean(
		"Level Up Announcements",
		"announceLevelUp",
		"if level ups should be announced (in channel)",
		null,
		1,
		emojis.default.pencil,
		"default"
	),
	genericBoolean(
		"Auto Link Sourcing",
		"autoSourcing",
		"if linked images should be auto sourced (includes non prefixed messages)",
		"if linked images should be auto sourced",
		0,
		emojis.default.info,
		"default"
	)
];

export default Settings;

Settings.forEach(s => {
	if ((s.shortDescription !== null && s.shortDescription.length > 50) || (s.shortDescription === null && s.description.length > 50)) throw new Error(`shortDescription for setting "${s.name}" is longer than 50 characters.`);
});
