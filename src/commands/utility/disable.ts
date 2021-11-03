import db from "@db";
import BotFunctions from "@util/BotFunctions";
import type MaidBoye from "@MaidBoye";
import ComponentHelper from "@util/components/ComponentHelper";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { Strings } from "@uwu-codes/utils";
import { emojis, permissionNames } from "@config";
import CommandHandler from "@cmd/CommandHandler";
import type { RawDisableEntry } from "@models/Guild/DisableEntry";
import DisableEntry from "@models/Guild/DisableEntry";
import chunk from "chunk";
import Eris from "eris";

export default new Command("disable")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageGuild")
	.setDescription("Manage this servers disabled categories/commands")
	.setUsage(async function (msg, cmd) {
		return {
			embeds: [
				new EmbedBuilder()
					.setTitle("Command Help")
					.setColor("green")
					.setDescription([
						`Description: ${cmd.description || "None"}`,
						`Restrictions: ${cmd.restrictions.length === 0 ? "None" : ""}`,
						...(cmd.restrictions.length === 0 ? [] : cmd.restrictions.map(r => `- **${Strings.ucwords(r)}**`)),
						"Usage:",
						`${emojis.default.dot} Add Entry: \`${msg.gConfig.getFormattedPrefix()}disable add all <channel/user/role>\``,
						`${emojis.default.dot} Add Entry: \`${msg.gConfig.getFormattedPrefix()}disable add <command/category> [channel/user/role]\``,
						`${emojis.default.dot} Remove Entry: \`${msg.gConfig.getFormattedPrefix()}disable remove <id>\` (see list)`,
						`${emojis.default.dot} List Entries: \`${msg.gConfig.getFormattedPrefix()}disable list\``,
						"If the last argument is not provided to add, the entry applies server wide",
						"",
						`User Permissions: ${cmd.userPermissions.length === 0 ? "None" : ""}`,
						...(cmd.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"]),
						`Bot Permissions: ${cmd.botPermissions.length === 0 ? "None" : ""}`,
						...(cmd.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"])
					].join("\n"))
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.toJSON()
			]
		};
	})
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "add",
			description: "Add a disable entry (provide no last argument for server wide)",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "type",
					description: "The type. Either a command, category, or \"all\".",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.MENTIONABLE,
					name: "filter",
					description: "Where this applies (for channel, regular commands must be used)",
					required: false
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "remove",
			description: "Remove a disable entry",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "id",
					description: "The id of the entry to remove (see list)",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "list",
			description: "List the current disable entries"
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply(`H-hey! You used that command wrong.. Try looking at \`${msg.gConfig.getFormattedPrefix()}help disable\``);
		switch (msg.args[0].toLowerCase()) {
			case "add": {
				if (msg.gConfig.disable.length >= 100) return msg.reply("H-hey! This server already has the maximum amount of disable entries..");
				// const scope = msg.args.length >= 4 ? await msg.getChannelFromArgs(2, 0) : "server";
				// if (scope === null) return msg.reply("H-hey! That wasn't a valid channel..");
				let type: 0 | 1 | 2, value: string | null, filterType: 0 | 1 | 2 | 3, filterValue: string | null;

				if (msg.args.length < 2) return msg.reply(`H-hey! You used that command wrong.. Try looking at \`${msg.gConfig.getFormattedPrefix()}help disable\``);
				else if (msg.args[1].toLowerCase() === "all") {
					type = DisableEntry.ALL;
					value = null;
				} else {
					const cat = CommandHandler.getCategory(msg.args[1]);
					const cmd = CommandHandler.getCommand(msg.args[1]);

					if (cat !== null) {
						type = DisableEntry.CATEGORY;
						value = cat.name;
					} else if (cmd !== null) {
						type = DisableEntry.COMMAND;
						value = cmd.triggers[0];
					} else return msg.reply("H-hey! We couldn't find a category or command with what you provided..");
				}

				if (msg.args.length >= 3) {
					const user = await msg.getUserFromArgs(2, 0);
					const role = await msg.getRoleFromArgs(2, 0);
					const channel = await msg.getChannelFromArgs(2, 0);

					if (user !== null) {
						filterType = DisableEntry.FILTER_USER;
						filterValue = user.id;
					} else if (role !== null) {
						filterType = DisableEntry.FILTER_ROLE;
						filterValue = role.id;
					} else if (channel !== null) {
						filterType = DisableEntry.FILTER_CHANNEL;
						filterValue = channel.id;
					} else return msg.reply("H-hey! Whatever you provided for a filter was invalid..");
				} else {
					filterType = DisableEntry.FILTER_SERVER;
					filterValue = null;
				}

				if (type === DisableEntry.ALL && filterType === DisableEntry.FILTER_SERVER) return msg.reply("H-hey! You can't disable all commands server wide.. You must provide a filter.");

				const rawDisable = await db.query("SELECT * FROM disable WHERE guild_id=?", [msg.channel.guild.id]).then(v => (v as Array<RawDisableEntry>));
				const dup = rawDisable.find(d => type === BotFunctions.parseBit(d.type) && value === d.value && filterType === BotFunctions.parseBit(d.filter_type) && filterValue === d.filter_value);
				if (dup) {
					const id = msg.gConfig.disable.indexOf(msg.gConfig.disable.find(d => d.id === dup.id)!);
					return msg.reply(`H-hey! An entry (#${id + 1}) with those specifications already exists..`);
				} else await msg.gConfig.addDisableEntry(type, value, filterType, filterValue);

				switch (type) {
					case DisableEntry.ALL: {
						switch (filterType) {
							// we should never see this
							case DisableEntry.FILTER_SERVER: return msg.reply(
								`All commands have been disabled server wide, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_USER: return msg.reply({
								content: `All commands have been disabled for the user <@!${filterValue!}>, entry #${msg.gConfig.disable.length}.`,
								allowedMentions: { users: false }
							});
							case DisableEntry.FILTER_ROLE: return msg.reply(
								`All commands have been disabled for the role <@&${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_CHANNEL: return msg.reply(
								`All commands have been disabled in <#${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							default: return;
						}
					}

					case DisableEntry.CATEGORY: {
						switch (filterType) {
							case DisableEntry.FILTER_SERVER: return msg.reply(
								`The category **${value!}** has been disabled server wide, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_USER: return msg.reply({
								content: `The category **${value!}** has been disabled for the user <@!${filterValue!}>, entry #${msg.gConfig.disable.length}.`,
								allowedMentions: { users: false }
							});
							case DisableEntry.FILTER_ROLE: return msg.reply(
								`The category **${value!}** has been disabled for the role <@&${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_CHANNEL: return msg.reply(
								`The category **${value!}** has been disabled in <#${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							default: return;
						}
					}

					case DisableEntry.COMMAND: {
						switch (filterType) {
							case DisableEntry.FILTER_SERVER: return msg.reply(
								`The command **${value!}** has been disabled server wide, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_USER: return msg.reply({
								content: `The command **${value!}** has been disabled for the user <@!${filterValue!}>, entry #${msg.gConfig.disable.length}.`,
								allowedMentions: { users: false }
							});
							case DisableEntry.FILTER_ROLE: return msg.reply(
								`The command **${value!}** has been disabled for the role <@&${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							case DisableEntry.FILTER_CHANNEL: return msg.reply(
								`The command **${value!}** has been disabled in <#${filterValue!}>, entry #${msg.gConfig.disable.length}.`
							);
							default: return;
						}
					}

					default: return;
				}
			}

			case "remove": {
				if (msg.args.length < 2)  return msg.reply(`H-hey! You used that command wrong.. Try looking at \`${msg.gConfig.getFormattedPrefix()}help disable\``);
				const id = Number(msg.args[1]);
				if (isNaN(id) || id < 1) return msg.reply("H-hey! The entry id needs to be a positive number..");
				const entry = msg.gConfig.disable.find((d, i) => id === (i + 1));
				if (entry === undefined) return msg.reply("H-hey! We failed to find an entry with that id..");
				await msg.gConfig.removeDisableEntry(entry.id);
				return msg.reply(`Entry #${id} has been removed.`);
			}

			case "list": {
				if (msg.gConfig.disable.length === 0) return msg.reply("There aren't any entries to list..");
				const pages = chunk(msg.gConfig.disable, 10);
				const m = await msg.reply("Warming up..");
				// eslint-disable-next-line no-inner-declarations
				async function setPage(this: MaidBoye, page: number) {
					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Entry List")
								.setDescription(pages[page].map((d, i) => {
									switch (d.type) {
										case "all": {
											switch (d.filterType) {
												case "server": return `${(i + 1) + (page * 10)}.) all commands server wide`;
												case "user": return `${(i + 1) + (page * 10)}.) all commands for user <@!${d.filterValue}>`;
												case "role": return `${(i + 1) + (page * 10)}.) all commands for role <@&${d.filterValue}>`;
												case "channel": return `${(i + 1) + (page * 10)}.) all commands in channel <#${d.filterValue}>`;
											}
											break;
										}

										case "category": {
											switch (d.filterType) {
												case "server": return `${(i + 1) + (page * 10)}.) category **${d.value}** server wide`;
												case "user": return `${(i + 1) + (page * 10)}.) category **${d.value}** for user <@!${d.filterValue}>`;
												case "role": return `${(i + 1) + (page * 10)}.) category **${d.value}** for role <@&${d.filterValue}>`;
												case "channel": return `${(i + 1) + (page * 10)}.) category **${d.value}** in channel <#${d.filterValue}>`;
											}
											break;
										}

										case "command": {
											switch (d.filterType) {
												case "server": return `${(i + 1) + (page * 10)}.) command **${d.value}** server wide`;
												case "user": return `${(i + 1) + (page * 10)}.) command **${d.value}** for user <@!${d.filterValue}>`;
												case "role": return `${(i + 1) + (page * 10)}.) command **${d.value}** for role <@&${d.filterValue}>`;
												case "channel": return `${(i + 1) + (page * 10)}.) command **${d.value}** in channel <#${d.filterValue}>`;
											}
											break;
										}
									}
								}))
								.setFooter(`Page ${page + 1}/${pages.length} | UwU`)
								.toJSON()
						],
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `disable-back.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.last, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `disable-stop.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.stop, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `disable-next.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.next, "default"))
							.toJSON()
					});
					const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && it.member!.user.id === msg.author.id && it.data.custom_id.startsWith("diable-"));
					if (wait === null) {
						await m.edit({
							content: "",
							components: []
						});
						return;
					} else {
						if (wait.data.custom_id.includes("back")) void setPage.call(this,  page - 1);
						if (wait.data.custom_id.includes("stop")) {
							await m.edit({
								content: "",
								components: []
							});
							return;
						}
						if (wait.data.custom_id.includes("next")) void setPage.call(this,  page + 1);
					}
				}

				void setPage.call(this, 0);
			}
		}
	});
