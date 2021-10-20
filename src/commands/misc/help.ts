import { beta, developers, emojis, permissionNames } from "@config";
import Command from "@cmd/Command";
import CommandHandler from "@cmd/CommandHandler";
import ComponentHelper from "@util/components/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import type MaidBoye from "@MaidBoye";
import type ExtendedMessage from "@util/ExtendedMessage";

export function getInfo(this: MaidBoye, msg: Eris.Message<Eris.GuildTextableChannel>) {
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
		cHome.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-category-${cat.name}.${msg.id}.${msg.author.id}`, false, emoji);

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
				.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-home.${msg.id}.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
				.toJSON()
		};
	});

	return {
		home: {
			embeds: [ eHome.toJSON() ],
			components: cHome.toJSON()
		} as Eris.AdvancedMessageContent,
		categories
	};
}

export async function getCommand(this: MaidBoye, msg: ExtendedMessage, cmd: Command) {
	const usage = await cmd.usage.call(this, msg, cmd);
	if (typeof usage !== "string" && usage !== null) return usage;
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
				...(cmd.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"]),
				`Bot Permissions: ${cmd.botPermissions.length === 0 ? "None" : ""}`,
				...(cmd.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"])
			].join("\n"))
			.setAuthor(msg.author.tag, msg.author.avatarURL);
		return {
			embeds: [ e.toJSON() ],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `help-home.${msg.id}.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
				.toJSON()
		} as Eris.AdvancedMessageContent;
	}
}

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
		const { home, categories } = getInfo.call(this, msg);
		if (msg.args.length === 0) return msg.reply(home);
		else {
			const cat = CommandHandler.getCategory(msg.args[0].toLowerCase());
			const cmd = CommandHandler.getCommand(msg.args[0].toLowerCase());
			if (cat) return msg.reply(categories[cat.name]);
			else if (cmd) {
				const content = await getCommand.call(this, msg, cmd);
				return msg.reply(content);
			} else return msg.reply("H-hey! I-I couldn't figure out what you were trying to do..");
		}
	});
