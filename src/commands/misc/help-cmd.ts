import Logger from "../../util/Logger";
import config from "@config";
import Command from "@cmd/Command";
import CommandHandler from "@cmd/CommandHandler";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import MaidBoye from "@MaidBoye";
import { DiscordHTTPError } from "slash-create";

export default new Command("help")
	.setPermissions("bot", "embedLinks")
	.setDescription("Find out how to use me..")
	.setUsage("[command]")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "category",
			description: "The category to get help with",
			required: false,
			choices: [] // this is done in the sync function due to categories not being loaded when this is called
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		try {
			const m = await msg.reply("Warming up..");
			const eHome = new EmbedBuilder().setAuthor(msg.author.tag, msg.author.avatarURL);
			const cHome = new ComponentHelper();
			const hasUseExternal = msg.channel.permissionsOf(this.user.id).has("useExternalEmojis");
			const categories = {} as Record<string, Eris.AdvancedMessageContent>;
			CommandHandler.categories.forEach((cat, i) => {
				if (cat.restrictions.includes("disabled") || (cat.restrictions.includes("beta") && !config.beta) || (cat.restrictions.includes("developer") && !config.developers.includes(msg.author.id))) return;
				eHome.addField(`${hasUseExternal && cat.displayName.emojiCustom ? `${cat.displayName.emojiCustom} ` : cat.displayName.emojiDefault ? `${cat.displayName.emojiDefault} ` : ""}${cat.displayName.text}`, `${cat.description || "No Description."}\nTotal Commands: **${cat.commands.length}**`, true);
				if ((i % 2) === 0) eHome.addBlankField(true);
				let emoji: Partial<Eris.PartialEmoji> | undefined;
				if (cat.displayName.emojiDefault !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiDefault, "default");
				if (hasUseExternal && cat.displayName.emojiCustom !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiCustom, "custom");
				cHome.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help-${cat.name}.${msg.author.id}`, false, emoji);

				const eCat = new EmbedBuilder()
					.setTitle(`${cat.displayName.emojiCustom ?? cat.displayName.emojiDefault ?? ""} ${cat.displayName.text}`)
					.setDescription(`Description: ${cat.description || "None"}\nTotal Commands: ${cat.commands.length}\n\\* - Has Slash Command Version\n\\*\\* - Requires [Lite](https://lite.maid.gay/invite) version for slash commands`)
					.setAuthor(msg.author.tag, msg.author.avatarURL);
				const cmdDesc = [] as Array<string>;
				const totalLen = cat.commands.reduce((a,b) => a + `\`${b.triggers[0]}\` - ${b.description}\n`.length, 0);
				cat.commands.forEach(cmd => {
					if (totalLen > 1900) cmdDesc.push(`\`${cmd.triggers[0]}\``);
					else cmdDesc.push(`\`${cmd.triggers[0]}\`${cmd.hasSlashVariant === true ? "\\*" : cmd.hasSlashVariant === "lite" ? "\\*\\*" : ""} - ${cmd.description || "No Description"}`);
				});
				eCat.setDescription(`${eCat.getDescription() ?? ""}\n\n${totalLen > 1900 ? cmdDesc.join(", ") : cmdDesc.join("\n")}`);
				categories[cat.name] = {
					content: "",
					embeds: [ eCat.toJSON() ],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.home, "default"), "Home")
						.toJSON()
				};
			});

			const home = {
				content: "",
				embeds: [ eHome.toJSON() ],
				components: cHome.toJSON()
			};

			if (msg.args.length === 0) void goHome.call(this);
			else {
				const cat = CommandHandler.getCategory(msg.args[0]);

				if (cat !== null) void goCat.call(this, cat.name);
				else {
					const cmd = CommandHandler.getCommand(msg.args[0]);
					if (cmd !== null) void goCommand.call(this, cmd);
					else return msg.reply("I-I couldn't find anything with what you provided..");
				}
			}

			async function goHome(this: MaidBoye) {
				await m.edit(home);
				const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && it.member!.user.id === msg.author.id && it.data.custom_id.startsWith("help-"));
				if (wait === null) {
					await m.edit({
						content: "",
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					void goCat.call(this, wait.data.custom_id.split(".")[0].split("-")[1]);
				}
			}

			async function goCat(this: MaidBoye, name: string) {
				await m.edit(categories[name]);
				const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && it.member!.user.id === msg.author.id && it.data.custom_id.startsWith("help-home"));
				if (wait === null) {
					await m.edit({
						content: "",
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					void goHome.call(this);
				}
			}

			async function goCommand(this: MaidBoye, cmd: Command) {
				const usage = await cmd.usage.call(this, msg, cmd);
				if (typeof usage !== "string" && usage !== null) await m.edit({
					components: [],
					embeds: [],
					content: "",
					...usage
				});
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
					await m.edit({
						embeds: [ e.toJSON() ],
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `help-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.home, "default"), "Home")
							.toJSON()
					});
				}

				const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && it.member!.user.id === msg.author.id && it.data.custom_id.startsWith("help-home"));
				if (wait === null) {
					await m.edit({
						content: "",
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					void goHome.call(this);
				}
			}
		} catch (err) {
			if (err instanceof DiscordHTTPError) {
				// Unknown message error
				if (err.code === 10008) {
					Logger.getLogger("HelpCommand").error(err);
					return;
				}
			}

			throw err;
		}
	});
