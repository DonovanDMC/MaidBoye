import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import { Strings } from "@uwu-codes/utils";
const Redis = db.r;

export default new Command("editsnipe", "esnipe")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user")
	.setDescription("Get the last edited message in a channel")
	.setUsage("[#channel]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
			name: "channel",
			description: "The channel to snipe (none for current)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.gConfig.settings.snipeDisabled === true) return msg.reply(`H-hey! Snipes are disabled.. This can be changed via \`${msg.gConfig.getFormattedPrefix()}setting\``);
		const ch = msg.args.length === 0 ? msg.channel : await msg.getChannelFromArgs();
		if (ch === null) return msg.reply("H-hey! That channel was invalid..");

		const snipe = await Redis.lpop(`snipe:edit:${msg.channel.id}`) as string | null;
		if (snipe === null) return msg.reply("No edit snipes were found..");
		else {
			const d = JSON.parse<{ oldContent: string; newContent: string; author: string; time: number; }>(snipe);
			const len = await Redis.llen(`snipe:edit:${msg.channel.id}`);
			return msg.reply({
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("Edit Snipe")
						.setDescription([
							`From <@!${d.author}> - Edited At ${BotFunctions.formatDiscordTime(d.time, "short-datetime", true)}`,
							`Old Content: ${Strings.truncate(d.oldContent, 125, true)}`,
							`New Content: ${Strings.truncate(d.newContent, 125, true)}`,
							""
						].join("\n"))
						.setFooter(`UwU | Snipe 1/${len + 1}`)
						.toJSON()
				]
			});
		}
	});
