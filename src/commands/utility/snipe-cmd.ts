import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import { Strings } from "@uwu-codes/utils";
const Redis = db.r;

export default new Command("snipe")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user")
	.setDescription("Get the last deleted message in a channel")
	.setUsage("[#channel]")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.CHANNEL,
			name: "channel",
			description: "The channel to snipe (none for current)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.gConfig.settings.snipeDisabled === true) return msg.reply(`H-hey! Snipes are disabled.. This can be changed via \`${msg.gConfig.getFormattedPrefix()}settings\``);
		const ch = msg.args.length === 0 ? msg.channel : await msg.getChannelFromArgs();
		if (ch === null) return msg.reply("H-hey! That channel was invalid..");

		const snipe = await Redis.lpop(`snipe:delete:${msg.channel.id}`) as string | null;
		if (snipe === null) return msg.reply("No snipes were found..");
		else {
			const d = JSON.parse<{ content: string; author: string; time: number; ref: null | Record<"link" | "author" | "content", string>; }>(snipe);
			const len = await Redis.llen(`snipe:delete:${msg.channel.id}`);
			return msg.reply({
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("Delete Snipe")
						.setDescription([
							`From <@!${d.author}> - Edited At ${BotFunctions.formatDiscordTime(d.time, "short-datetime", true)}`,
							`> ${Strings.truncate(d.content, 250, true)}`,
							"",
							...(d.ref === null ? [] : [
								`Replied Message - <@!${d.ref.author}>:`,
								`> ${Strings.truncate(d.ref.content, 50, true)} [[Jump](${d.ref.link})]`
							])
						].join("\n"))
						.setFooter(`UwU | Snipe 1/${len + 1}`)
						.toJSON()
				]
			});
		}
	});
