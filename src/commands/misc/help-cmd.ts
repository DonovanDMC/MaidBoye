import config from "@config";
import { CategoryRestrictions } from "@cmd/Category";
import Command from "@cmd/Command";
import CommandHandler from "@cmd/CommandHandler";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import { APIApplicationCommandOptionChoice, ApplicationCommandOptionType } from "discord-api-types";

export default new Command("help")
	.setPermissions("bot", "embedLinks")
	.setDescription("Find out how to use me..")
	.setUsage("[command]")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setSlashCommandOptions([
		{
			type: ApplicationCommandOptionType.String,
			name: "category",
			description: "The category to get help with",
			required: false,
			choices: CommandHandler.categories.map(cat => {
				if (cat.restrictions.includes("disabled")) return;
				else if ((cat.restrictions.includes("beta") && !config.beta)) return;
				else return {
					name: cat.displayName.text,
					value: cat.name
				};
			}).filter(Boolean) as Array<APIApplicationCommandOptionChoice>
		}
	])
	.setExecutor(async function(msg) {
		if (msg.args.length === 0) {
			const e = new EmbedBuilder().setAuthor(msg.author.tag, msg.author.avatarURL);
			const c = new ComponentHelper();
			const hasUseExternal = msg.channel.permissionsOf(this.user.id).has("useExternalEmojis");
			CommandHandler.categories.forEach((cat, i) => {
				if (cat.restrictions.includes("disabled")) return;
				if ((cat.restrictions.includes("beta") && !config.beta) || (cat.restrictions.includes("developer") && !config.developers.includes(msg.author.id))) return;
				e.addField(`${hasUseExternal && cat.displayName.emojiCustom ? `${cat.displayName.emojiCustom} ` : cat.displayName.emojiDefault ? `${cat.displayName.emojiDefault} ` : ""}${cat.displayName.text}`, `${cat.description || "No Description."}\nTotal Commands: **${cat.commands.length}**`, true);
				if ((i % 2) === 0) e.addBlankField(true);
				let emoji: Partial<Eris.PartialEmoji> | undefined;
				if (cat.displayName.emojiDefault !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiDefault, "default");
				if (hasUseExternal && cat.displayName.emojiCustom !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiCustom, "custom");
				c.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help.${cat.name}.${msg.author.id}`, (["disabled"] as Array<CategoryRestrictions>).some(v => cat.restrictions.includes(v)), emoji);
			});

			return msg.reply({
				embeds: [ e.toJSON() ],
				components: c.toJSON()
			});
		} else {
			const cat = CommandHandler.getCategory(msg.args[0]);

			if (cat !== null) {
				const e = new EmbedBuilder()
					.setDescription(`Description: ${cat.description || "None"}\nTotal Commands: ${cat.commands.length}`)
					.setAuthor(msg.author.tag, msg.author.avatarURL);
				const cmdDesc = [] as Array<string>;
				const totalLen = cat.commands.reduce((a,b) => a + `\`${b.triggers[0]}\` - ${b.description}\n`.length, 0);
				cat.commands.forEach(cmd => {
					if (totalLen > 1900) cmdDesc.push(`\`${cmd.triggers[0]}\``);
					else cmdDesc.push(`\`${cmd.triggers[0]}\` - ${cmd.description || "No Description"}`);
				});
				e.setDescription(`${e.getDescription() ?? ""}\n\n${totalLen > 1900 ? cmdDesc.join(", ") : cmdDesc.join("\n")}`);
				return msg.reply({
					embeds: [ e.toJSON() ],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help.home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.home, "default"), "Home")
						.toJSON()
				});
			} else {
				const cmd = CommandHandler.getCommand(msg.args[0]);
				if (cmd !== null) {
					const usage = await cmd.usage.call(this, msg, cmd);
					if (typeof usage !== "string" && usage !== null) return msg.reply(usage);
					else {
						const e = new EmbedBuilder()
							.setTitle("Command Help")
							.setColor("green")
							.setDescription([
								`Description: ${cmd.description || "None"}`,
								`Usage: \`${BotFunctions.formatPrefix(msg.gConfig)}${cmd.triggers[0]}${usage === null ? "" : ` ${usage}`}\``,
								`Restrictions: ${cmd.restrictions.length === 0 ? "None" : ""}`,
								...(cmd.restrictions.length === 0 ? [] : cmd.restrictions.map(r => `- **${Strings.ucwords(r)}**`)),
								"",
								`User Permissions: ${cmd.userPermissions.length === 0 ? "None" : ""}`,
								...(cmd.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${config.permissions[perm]}`), "\n```"]),
								`Bot Permissions: ${cmd.botPermissions.length === 0 ? "None" : ""}`,
								...(cmd.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${config.permissions[perm]}`), "\n```"])
							].join("\n"))
							.setAuthor(msg.author.tag, msg.author.avatarURL);
						return msg.reply({
							embeds: [ e.toJSON() ],
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help.home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.home, "default"), "Home")
								.toJSON()
						});
					}
				} else return msg.reply("I-I couldn't find anything with what you provided..");
			}
		}
	});
