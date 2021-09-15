import GuildConfig from "@db/Models/Guild/GuildConfig";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { yiffTypes } from "@config";
import Logger from "@util/Logger";
import Yiffy from "@util/req/Yiffy";
import { Strings } from "@uwu-codes/utils";
import Eris from "eris";
import ComponentHelper from "@util/ComponentHelper";

export default new Command("yiff", "thegoodstuff")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Y-you know what this is..")
	.setUsage(`<${yiffTypes.join("/")}>`)
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "type",
			description: "The type of yiff to fetch",
			required: false,
			choices: yiffTypes.map(y => ({
				name: Strings.ucwords(y),
				value: y
			}))
		}
	])
	.setRestrictions("nsfw")
	.setCooldown(3e3)
	.setExecutor(async function (msg) {
		let type: Exclude<GuildConfig["settings"]["defaultYiffType"], null>;
		if (msg.args.length === 0) {
			if (msg.gConfig.settings.defaultYiffType === null) type = yiffTypes[0];
			else {
				if (!yiffTypes.includes(msg.gConfig.settings.defaultYiffType)) {
					Logger.getLogger("YiffCommand").warn(`Unknown Default Yiff Type "${msg.gConfig.settings.defaultYiffType}" on guild ${msg.channel.guild.id}`);
					await msg.gConfig.edit({
						settings: {
							defaultYiffType: yiffTypes[0]
						}
					});
					type = yiffTypes[0];
				} else type = msg.gConfig.settings.defaultYiffType;
			}
		} else {
			type = msg.args[0].toLowerCase() as typeof type;
			if (!yiffTypes.includes(type)) return msg.reply(`Th-that wasn't a valid yiff type! You can use \`${msg.gConfig.getFormattedPrefix()}help yiff\` to see them..`);
		}

		// I was so proud of the spaghetti code I made when I first
		// rewrote this command, look at me now
		// (events/components/nsfw/yiff.ts)
		const img = await Yiffy.furry.yiff[type]("json", 1);
		return msg.reply({
			content: "H-here's your yiff!",
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`${Strings.ucwords(type)} Yiff!`)
					.setImage(img.url)
					.setColor("gold")
					.toJSON()
			],
			components: new ComponentHelper()
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton(img.reportURL, false, undefined, "Report")
				.addRow()
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `yiff-newimg-${type}.${msg.author.id}`, false, undefined, "New Image")
				.toJSON()
		});
	});
