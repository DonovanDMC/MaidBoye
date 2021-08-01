import config from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import CommandError from "@cmd/CommandError";
import ComponentInteractionCollector from "@util/ComponentInteractionCollector";
import { Strings } from "@uwu-codes/utils";
import Eris from "eris";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("selfroles")
	.setPermissions("bot", "embedLinks", "manageRoles")
	.setDescription("Manage self roles")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.SubCommand,
			name: "list",
			description: "List this server's self assignable roles"
		},
		{
			type: ApplicationCommandOptionType.SubCommand,
			name: "join",
			description: "Join a self assignable role",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "role",
					description: "The name of the role you want to join (see list)",
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubCommand,
			name: "leave",
			description: "Leave a self assignable role"
		},
		{
			type: ApplicationCommandOptionType.SubCommand,
			name: "add",
			description: "[Management] Add a self assignable role",
			options: [
				{
					type: ApplicationCommandOptionType.Role,
					name: "role",
					description: "The role to make self assignable",
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubCommand,
			name: "remove",
			description: "[Management] Remove a self assignable role",
			options: [
				{
					type: ApplicationCommandOptionType.Role,
					name: "role",
					description: "The role to make not self assignable",
					required: true
				}
			]
		}
	])
	.setCooldown(3e3)
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
						`${config.emojis.default.dot} List Roles: \`${msg.gConfig.getFormattedPrefix()}selfroles list\``,
						`${config.emojis.default.dot} Join Role: \`${msg.gConfig.getFormattedPrefix()}selfroles join <role or similar text>\``,
						`${config.emojis.default.dot} Leave Role: \`${msg.gConfig.getFormattedPrefix()}selfroles leave\` (no args)`,
						...(msg.member.permissions.has("manageRoles") ? [
							"Management Commands:",
							`${config.emojis.default.dot} Add Role: \`${msg.gConfig.getFormattedPrefix()}selfroles add\``,
							`${config.emojis.default.dot} Remove Role: \`${msg.gConfig.getFormattedPrefix()}selfroles remove\``,
							`${config.emojis.default.dot} Remove All: \`${msg.gConfig.getFormattedPrefix()}selfroles clear\``
						] : []),
						"",
						`User Permissions: ${cmd.userPermissions.length === 0 ? "None" : ""}`,
						...(cmd.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${config.permissions[perm]}`), "\n```"]),
						`Bot Permissions: ${cmd.botPermissions.length === 0 ? "None" : ""}`,
						...(cmd.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${config.permissions[perm]}`), "\n```"])
					].join("\n"))
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.toJSON()
			]
		};
	})
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length === 0) return new CommandError("INVALID_USAGE", cmd);
		const selfList = msg.uConfig.selfRolesJoined.filter(r => r.guildId === msg.channel.guild.id);
		switch (msg.args[0].toLowerCase()) {
			case "list": {
				if (msg.gConfig.selfRoles.size === 0) return msg.reply("Th-this server doesnt't have any self roles..");
				/* if (selfList.length === 0) return msg.reply("Y-you haven't gained any roles via self roles..");
				return msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
						.setTitle("Self Roles List")
						.setDescription(selfList.map(r => `- <@&${r.role}>`))
						.toJSON()
					]
				}); */
				return msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("Self Roles List")
							.setDescription(msg.gConfig.selfRoles.map(r => `- <@&${r.role}>`))
							.toJSON()
					]
				});
				break;
			}

			case "join": {
				if (msg.gConfig.selfRoles.size === 0) return msg.reply("Th-this server doesnt't have any self roles..");
				const roles = msg.gConfig.selfRoles.map(({ role }) => msg.channel.guild.roles.get(role)!).filter(r => r.name.toLowerCase().includes(msg.args.slice(1).join(" ").toLowerCase()));
				let role: Eris.Role;
				if (roles.length === 1) {
					role = roles[0];
					if (msg.member.roles.includes(role.id)) return msg.reply("Y-you already have that role!");
					else {
						await msg.member.addRole(role.id, "SelfRoles[Join]");
						await msg.uConfig.addSelfRoleJoined(role.id, msg.channel.guild.id);

						await msg.uConfig.fix(); // fix removes duplicates
						return msg.reply(`Congrats, you now have the <@&${role.id}> role!`);
					}
				} else {
					const makeChoice = await msg.reply({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription(`Your search "${msg.args.slice(1).join(" ").toLowerCase()}" matched multiple roles. Please select one.`)
								.setColor("gold")
								.toJSON()
						],
						components: new ComponentHelper()
							.addSelectMenu(`select-role.${msg.author.id}`, roles.map(r => ({
								label: r.name,
								value: r.id
							})), "Select A Role To Join", 1, 1)
							.addInteractionButton(ComponentHelper.BUTTON_DANGER, `select-role.${msg.author.id}.cancel`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Cancel")
							.toJSON()
					});
					const choice = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (i) => i.data.custom_id.startsWith(`select-role.${msg.author.id}`) && i.message.id === makeChoice.id && !!i.member?.user && i.member.user.id === msg.author.id);
					if (choice === null) return msg.reply("Th-this either timed out, or you made an invalid selection..");
					await choice.acknowledge();
					if (choice.data.custom_id.endsWith("cancel")) return choice.editOriginalMessage({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("Cancelled.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					const [made] = choice.data.values!;
					if (!roles.map(r => r.id).includes(made)) return choice.editOriginalMessage({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("You made an invalid choice..")
								.setColor("red")
								.toJSON()
						],
						components: []
					});

					if (msg.member.roles.includes(made)) return choice.editOriginalMessage({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("Y-you already have that role!")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					await msg.member.addRole(made, "SelfRoles[Join]");
					await msg.uConfig.addSelfRoleJoined(made, msg.channel.guild.id);
					await msg.uConfig.fix();
					return choice.editOriginalMessage({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription(`Congrats, you now have the <@&${made}> role!`)
								.setColor("green")
								.toJSON()
						],
						components: []
					});
				}
				break;
			}

			case "leave": {
				if (msg.gConfig.selfRoles.size === 0) return msg.reply("Th-this server doesnt't have any self roles..");
				if (selfList.length === 0) return msg.reply("Y-you haven't gained any roles via self roles..\n(you cannot remove roles that have been manually added to you via this)");
				const makeChoice = await msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("Please select a role to leave.\nIf a role you're looking for isn't listed here, and you have the role, you did not join it via self roles. You cannot leave roles that were manually assigned to you by server staff.")
							.setColor("gold")
							.toJSON()
					],
					components: new ComponentHelper()
						.addSelectMenu(`select-role.${msg.author.id}`, selfList.map(r => ({
							label: msg.channel.guild.roles.get(r.role)?.name ?? `Unknown[${r.role}]`,
							value: r.role
						})), "Select A Role To Leave", 1, 1)
						.addInteractionButton(ComponentHelper.BUTTON_DANGER, `select-role.${msg.author.id}.cancel`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Cancel")
						.toJSON()
				});
				const choice = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (i) => i.data.custom_id.startsWith(`select-role.${msg.author.id}`) && i.message.id === makeChoice.id && !!i.member?.user && i.member.user.id === msg.author.id);
				if (choice === null) return msg.reply("Th-this either timed out, or you made an invalid selection..");
				await choice.acknowledge();
				if (choice.data.custom_id.endsWith("cancel")) return choice.editOriginalMessage({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("Cancelled.")
							.setColor("red")
							.toJSON()
					],
					components: []
				});
				const [made] = choice.data.values!;
				if (!selfList.map(r => r.role).includes(made)) return choice.editOriginalMessage({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("You made an invalid choice..")
							.setColor("red")
							.toJSON()
					],
					components: []
				});

				// we can safely assume the role has been deleted or something similar
				// if they don't have the role at this point
				// @TODO pull entries from selfRolesJoined on memberUpdate->roleRemove
				/* if (!msg.member.roles.includes(made)) return this.editOriginalInteractionResponse(this.user.id, choice.token, {
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("Y-you don't have that role!")
							.setColor("red")
							.toJSON()
					],
					components: []
				}); */
				if (msg.member.roles.includes(made)) await msg.member.removeRole(made, "SelfRoles[Leave]");
				await msg.uConfig.removeSelfRoleJoined(made, "role");
				await msg.uConfig.fix();
				return choice.editOriginalMessage({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription(`Congrats, you no longer have the <@&${made}> role.`)
							.setColor("orange")
							.toJSON()
					],
					components: []
				});
				break;
			}

			case "add": {
				if (!msg.member.permissions.has("manageRoles")) return msg.reply("Y-you must have the **Manage Roles** permission to use this!");
				if (msg.args.length === 1) return msg.reply("Y-you have to provide a role to add..");
				const role = await msg.getRoleFromArgs(1, 0);
				if (role === null) return msg.reply("Th-that wasn't a valid role..");
				if (msg.gConfig.selfRoles.map(r => r.role).includes(role.id)) return msg.reply("Th-that role is already self assignable..");
				const compare = role.compareToMember(msg.channel.guild.me);
				if (["higher", "same"].includes(compare)) return msg.reply("Th-that role is higher than, or the same as my higest role.. I cannot assign it");
				await msg.gConfig.addSelfRole(role.id, msg.author.id);
				return msg.reply(`The role <@&${role.id}> is now self assignable`);
				break;
			}

			case "remove": {
				if (!msg.member.permissions.has("manageRoles")) return msg.reply("Y-you must have the **Manage Roles** permission to use this!");
				if (msg.gConfig.selfRoles.size === 0) return msg.reply("Th-this server doesnt't have any self roles to remove..");
				if (msg.args.length === 1) return msg.reply("Y-you have to provide a role to remove..");
				const role = await msg.getRoleFromArgs(1, 0);
				if (role === null) return msg.reply("Th-that wasn't a valid role..");
				if (!msg.gConfig.selfRoles.map(r => r.role).includes(role.id)) return msg.reply("Th-that role isn't self assignable..");
				await msg.gConfig.removeSelfRole(role.id, "role");
				return msg.reply(`The role <@&${role.id}> is no longer self assignable`);
				break;
			}
		}
	});
