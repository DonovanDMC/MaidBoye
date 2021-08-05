import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { Strings } from "@uwu-codes/utils";
import config from "@config";
import CommandHandler from "@util/cmd/CommandHandler";
import DisableEntry from "@db/Models/Guild/DisableEntry";

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
						`${config.emojis.default.dot} Add Entry: \`${msg.gConfig.getFormattedPrefix()}disable add <command/category/all> [#channel]\``,
						`${config.emojis.default.dot} Remove Entry: \`${msg.gConfig.getFormattedPrefix()}disable remove <id>\` (see list)`,
						`${config.emojis.default.dot} List Entries: \`${msg.gConfig.getFormattedPrefix()}disable list\``,
						"If channel is provided to add, disable is channel specific. Otherwise, disable applies server wide",
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
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply(`H-hey! You used that command wrong.. Try looking at \`${msg.gConfig.getFormattedPrefix()}help disable\``);
		switch (msg.args[0].toLowerCase()) {
			case "add": {
				const scope = msg.args.length >= 4 ? await msg.getChannelFromArgs(2, 0) : "server";
				if (scope === null) return msg.reply("H-hey! That wasn't a valid channel..");
				let type: 0 | 1 | 2, value: string | null;
				switch (msg.args[1]?.toLowerCase()) {

					case "all": {
						type = DisableEntry.ALL;
						value = null;
						break;
					}

					case "category": {
						if (msg.args.length === 2) return msg.reply("H-hey! A command to disable is required..");
						const cat = CommandHandler.getCategory(msg.args[2].toLowerCase());
						if (cat === null) return msg.reply("H-hey! That wasn't a valid category..");
						type = DisableEntry.CATEGORY;
						value = cat.name;
						break;
					}

					case "command": {
						if (msg.args.length === 2) return msg.reply("H-hey! A command to disable is required..");
						const cmd = CommandHandler.getCommand(msg.args[2].toLowerCase());
						if (cmd === null) return msg.reply("H-hey! That wasn't a valid command..");
						if (["disable"].includes(cmd.triggers[0])) return msg.reply("H-hey! That command can't be disabled..");
						type = DisableEntry.COMMAND;
						value = cmd.triggers[0];
						break;
					}

					default:  return msg.reply(`H-hey! You used that command wrong.. Try looking at \`${msg.gConfig.getFormattedPrefix()}help disable\``);
				}

				await msg.gConfig.addDisableEntry(type, value, scope === "server" ? null : scope.id);
				return msg.reply(`Entry has been added, **#${msg.gConfig.disable.length}**`);
			}
		}
		this.events
	});
