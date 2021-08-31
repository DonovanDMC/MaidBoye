import { beta, developers, emojis, permissionNames } from "@config";
import Command from "@cmd/Command";
import CommandHandler from "@cmd/CommandHandler";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import Eris, { DiscordRESTError } from "eris";
import { Strings } from "@uwu-codes/utils";
import MaidBoye from "@MaidBoye";
import ErrorHandler from "@util/handlers/ErrorHandler";

export default new Command("help")
	.setPermissions("bot", "embedLinks")
	.setDescription("Find out how to use me..")
	.setUsage("[command]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
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
				if (cat.restrictions.includes("disabled") || (cat.restrictions.includes("beta") && !beta) || (cat.restrictions.includes("developer") && !developers.includes(msg.author.id))) return;
				eHome.addField(`${hasUseExternal && cat.displayName.emojiCustom ? `${cat.displayName.emojiCustom} ` : cat.displayName.emojiDefault ? `${cat.displayName.emojiDefault} ` : ""}${cat.displayName.text}`, `${cat.description || "No Description."}\nTotal Commands: **${cat.commands.length}**`, true);
				if ((i % 2) === 0) eHome.addBlankField(true);
				let emoji: Partial<Eris.PartialEmoji> | undefined;
				if (cat.displayName.emojiDefault !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiDefault, "default");
				if (hasUseExternal && cat.displayName.emojiCustom !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiCustom, "custom");
				cHome.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-${cat.name}.${msg.author.id}`, false, emoji);

				const eCat = new EmbedBuilder()
					.setTitle(`${cat.displayName.emojiCustom ?? cat.displayName.emojiDefault ?? ""} ${cat.displayName.text}`)
					.setDescription(`Description: ${cat.description || "None"}\nTotal Commands: ${cat.commands.length}\n\\* - Has Slash Command Version\n\\*\\* - Requires [Lite](https://lite.maid.gay/invite) version for slash commands`)
					.setAuthor(msg.author.tag, msg.author.avatarURL);
				const cmdDesc = [] as Array<string>;
				const totalLen = cat.commands.reduce((a,b) => a + `\`${b.triggers[0]}\` - ${b.description}\n`.length, 0);
				cat.commands.forEach(d => {
					if (totalLen > 1900) cmdDesc.push(`\`${d.triggers[0]}\``);
					else cmdDesc.push(`\`${d.triggers[0]}\`${d.applicationCommands.length > 0 ? "\\*" : d.liteApplicationCommands.length > 0 ? "\\*\\*" : ""} - ${d.description || "No Description"}`);
				});
				eCat.setDescription(`${eCat.getDescription() ?? ""}\n\n${totalLen > 1900 ? cmdDesc.join(", ") : cmdDesc.join("\n")}`);
				categories[cat.name] = {
					content: "",
					embeds: [ eCat.toJSON() ],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
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
					const d = CommandHandler.getCommand(msg.args[0]);
					if (d !== null) void goCommand.call(this, d);
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

			async function goCommand(this: MaidBoye, d: Command) {
				const usage = await d.usage.call(this, msg, d);
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
							`Description: ${d.description || "None"}`,
							`Usage: \`${BotFunctions.formatPrefix(msg.gConfig)}${d.triggers[0]}${usage === null ? "" : ` ${usage}`}\``,
							`Restrictions: ${d.restrictions.length === 0 ? "None" : ""}`,
							...(d.restrictions.length === 0 ? [] : d.restrictions.map(r => `- **${Strings.ucwords(r)}**`)),
							"",
							`User Permissions: ${d.userPermissions.length === 0 ? "None" : ""}`,
							...(d.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...d.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"]),
							`Bot Permissions: ${d.botPermissions.length === 0 ? "None" : ""}`,
							...(d.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...d.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"])
						].join("\n"))
						.setAuthor(msg.author.tag, msg.author.avatarURL);
					await m.edit({
						embeds: [ e.toJSON() ],
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
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
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
