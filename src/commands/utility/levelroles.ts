import BotFunctions from "../../util/BotFunctions";
import MaidBoye from "../../main";
import EmbedBuilder from "../../util/EmbedBuilder";
import ComponentHelper from "../../util/components/ComponentHelper";
import { emojis } from "@config";
import chunk from "chunk";
import Command from "@cmd/Command";
import Eris, { DiscordRESTError } from "eris";
import ErrorHandler from "@util/handlers/ErrorHandler";


export default new Command("levelroles")
	.setPermissions("bot", "manageRoles")
	.setPermissions("user")
	.setDescription("Manage this servers level up roles")
	.setUsage("todo")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "add",
			description: "Add a level role",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.ROLE,
					name: "role",
					description: "The role to add to users when they reach the level",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "level",
					description: "The level at which to give the role",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "remove",
			description: "Remove a level role",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.ROLE,
					name: "role",
					description: "The role to remove",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "list",
			description: "List the level roles"
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply(`H-hey! You didn't use that command properly.. Try \`${msg.gConfig.getFormattedPrefix()}help levelroles\``);
		switch (msg.args[0].toLowerCase()) {
			case "add": {
				if (!msg.member.permissions.has("manageRoles")) return msg.reply("H-hey! You need the **Manage Roles** permission to use this..");
				if (msg.gConfig.levelRoles.length >= 25) return msg.reply("H-hey! This server already has the maximum amount of level roles..");
				if (msg.args.length < 3) return msg.reply("H-hey! Both a role and level are required..");
				const role = await msg.getRoleFromArgs(1, 0, true);
				if (role === null) return msg.reply("H-hey! That wasn't a valid role..");
				const ex = msg.gConfig.levelRoles.find(r => r.role === role.id);
				if (ex) return msg.reply(`The role <@&${role.id}> has already been added for level **${BotFunctions.calcLevel(ex.xpRequired).level}**..`);
				const level = Number(msg.args[2]);
				if (!level || level < 1 || Math.floor(level) !== level || level > 5000) return msg.reply("H-hey! The level must be a positive number between `1` and `5000`..");
				await msg.gConfig.addLevelRole(role.id, BotFunctions.calcExp(level).total);
				return msg.reply(`The role <@&${role.id}> will now be added to people when they reach the level **${level}**\n(if they are already this level, they will get it next level up)`);
			}

			case "remove": {
				if (!msg.member.permissions.has("manageRoles")) return msg.reply("H-hey! You need the **Manage Roles** permission to use this..");
				if (msg.args.length < 2) return msg.reply("H-hey! The role to remove is required..");
				const role = await msg.getRoleFromArgs(1, 0, true);
				if (role === null) return msg.reply("H-hey! That role was invalid..");
				const r = msg.gConfig.levelRoles.find(l => l.role === role.id);
				if (!r) return msg.reply("H-hey! We couldn't find an entry using that role..");
				await msg.gConfig.removeLevelRole(r.id, "id");
				return msg.reply(`<@&${role.id}> has been removed.`);
			}

			case "list": {
				try {
					if (msg.gConfig.levelRoles.length === 0) return msg.reply("This server doesn't have any level roles to list..");
					const pages = chunk(msg.gConfig.levelRoles, 10);
					const m = await msg.reply("Warming up..");
					// eslint-disable-next-line no-inner-declarations
					async function setPage(this: MaidBoye, page: number) {
						await m.edit({
							content: "",
							embeds: [
								new EmbedBuilder(true, msg.author)
									.setTitle("Level Roles List")
									.setDescription(pages[page].map((r) => `<@&${r.role}> - **level ${BotFunctions.calcLevel(r.xpRequired).level}**`))
									.setFooter(`Page ${page + 1}/${pages.length} | UwU`)
									.toJSON()
							],
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `levelroles-back.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.last, "default"))
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `levelroles-stop.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.stop, "default"))
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `levelroles-next.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.next, "default"))
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
							if (wait.data.custom_id.includes("last")) void setPage.call(this,  page - 1);
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
				} catch (err) {
					if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
					else throw err;
				}
			}
		}
	});
