import config from "@config";
import BotFunctions from "@util/BotFunctions";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";

export default new Command("prefix")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageGuild")
	.setDescription("Set the prefix you use me with")
	.setUsage("<add/remove/reset/list>")
	.setHasSlashVariant(true)
	.setCooldown(5e3)
	.setExecutor(async function(msg) {
		switch (msg.args[0]) {
			case "add": {
				const space = msg.dashedArgs.value.includes("space") || msg.dashedArgs.keyValue.space === "true";
				if (msg.gConfig.prefix.length >= 10) return msg.reply("H-hey! This server already has 10 prefixes, please remove some before you add more!");
				if ([...msg.gConfig.prefix.map(({ value }) => value), `<@${this.user.id}>`, `<@!${this.user.id}>`].includes(msg.args[1].toLowerCase())) return msg.reply("H-hey! This server already has that as a prefix.");
				await msg.gConfig.mongoEdit({
					$push: {
						prefix: {
							value: msg.args[1].toLowerCase(),
							space
						}
					}
				});
				return msg.reply(`Successfully added **${msg.args[1].toLowerCase()}** to this server's prefixes.`);
				break;
			}

			case "remove": {
				if ([`<@${this.user.id}>`, `<@!${this.user.id}>`].includes(msg.args[1])) return msg.reply("H-hey! You can't remove that prefix..");
				if (!msg.gConfig.prefix.map(({ value }) => value).includes(msg.args[1].toLowerCase())) return msg.reply("H-hey! This server doesn't have that as one of its prefixes..");
				await msg.gConfig.mongoEdit({
					$pull: {
						prefix: msg.gConfig.prefix.find(p => p.value === msg.args[1].toLowerCase())
					}
				});
				return msg.reply(`Successfully removed **${msg.args[1].toLowerCase()}** from this server's prefixes.`);
				break;
			}

			case "reset": {
				if (msg.gConfig.prefix.length === 1 && msg.gConfig.prefix[0].value === "maid") return msg.reply("There isn't anything to reset?");
				await msg.gConfig.edit({
					prefix: config.defaults.guild.prefix
				});
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
