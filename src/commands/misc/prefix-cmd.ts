import config from "@config";
import BotFunctions from "@util/BotFunctions";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("prefix")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageGuild")
	.setDescription("Set the prefix you use me with")
	.setUsage("<add/remove/reset/list>")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "add",
			description: "Add additional prefixes",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "value",
					description: "The prefix to add",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "space",
					description: "If this prefix should have a space before the command",
					required: false,
					choices: [
						{
							name: "Yes",
							value: "--space"
						},
						{
							name: "No",
							value: ""
						}
					]
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "remove",
			description: "remove a prefix",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "prefix",
					description: "The prefix to remove (see list Subcommand)",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "reset",
			description: "Reset all prefixes",
			options: []
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "list",
			description: "List current prefixes",
			options: []
		}
	])
	.setCooldown(5e3)
	.setParsedFlags("space")
	.setExecutor(async function(msg) {
		switch (msg.args[0]?.toLowerCase()) {
			case "add": {
				const space = msg.dashedArgs.value.includes("space") || msg.dashedArgs.keyValue.space === "true";
				if (msg.gConfig.prefix.length >= 10) return msg.reply("H-hey! This server already has 10 prefixes, please remove some before you add more!");
				if ([...msg.gConfig.prefix.map(({ value }) => value), `<@${this.user.id}>`, `<@!${this.user.id}>`].includes(msg.args[1].toLowerCase())) return msg.reply("H-hey! This server already has that as a prefix.");
				if (msg.args[1].toLowerCase().length > 25) return msg.reply("H-hey! That prefix is too long..");
				await msg.gConfig.addPrefix(msg.args[1].toLowerCase(), space);
				return msg.reply(`Successfully added **${msg.args[1].toLowerCase()}** to this server's prefixes.`);
				break;
			}

			case "remove": {
				if ([`<@${this.user.id}>`, `<@!${this.user.id}>`].includes(msg.args[1])) return msg.reply("H-hey! You can't remove that prefix..");
				if (!msg.gConfig.prefix.map(({ value }) => value).includes(msg.args[1].toLowerCase())) return msg.reply("H-hey! This server doesn't have that as one of its prefixes..");
				await msg.gConfig.removePrefix(msg.args[1].toLowerCase(), "value");
				return msg.reply(`Successfully removed **${msg.args[1].toLowerCase()}** from this server's prefixes.`);
				break;
			}

			case "reset": {
				if (msg.gConfig.prefix.length === 1 && msg.gConfig.prefix[0].value === "maid") return msg.reply("There isn't anything to reset?");
				await msg.gConfig.resetPrefixes();
				return msg.reply(`Successfully reset this servers prefixes, you can use \`${config.defaults.prefix}\`.`);
				break;
			}

			case "list": {
				return msg.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.setTitle("Prefix List")
							.setDescription(
								`<@!${this.user.id}>`,
								msg.gConfig.prefix.map(({ value, space }) => `\`${value}\` (Space: ${space ? "Yes" : "No"})`)
							)
							.toJSON()
					]
				});
				break;
			}

			default: {
				return msg.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.setDescription([
								"H-hey.. This command is a bit complicated, so here's some extra help!",
								"",
								`Add Prefix: \`${BotFunctions.formatPrefix(msg.gConfig)}prefix add <prefix>\`\\*`,
								`Remove Prefix: \`${BotFunctions.formatPrefix(msg.gConfig)}prefix remove <prefix>\``,
								`Reset Prefixes: \`${BotFunctions.formatPrefix(msg.gConfig)}prefix reset\``,
								`List Prefixes: \`${BotFunctions.formatPrefix(msg.gConfig)}prefix list\``,
								`Note: mentions cannot be added or removed, you can always use <@!${this.user.id}> for commands`,
								"",
								"\\* - If you want to use a space with your prefix:",
								`\`${BotFunctions.formatPrefix(msg.gConfig)}prefix add <prefix> --space\``
							].join("\n"))
							.toJSON()
					]
				});
				break;
			}
		}
	});
