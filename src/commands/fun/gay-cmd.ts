import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import DankMemerAPI from "@util/req/DankMemerAPI";
import { MemeRequestResponse } from "dankmemerapi";
import Eris from "eris";

export default new Command("gay")
	.setPermissions("bot", "embedLinks")
	.setDescription("Make someone gay")
	.setUsage("[@user/text]")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to gayify (none for yourself)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const m = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		if (m === null) return msg.reply("H-hey! That wasn't a valid user..");
		let img: MemeRequestResponse;
		try {
			img = await DankMemerAPI.gay(m.staticAvatarURL);
		} catch (err) {
			Logger.getLogger("GayCommand").error(err);
			return msg.reply("Image api returned an error..");
		}

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`${m.tag} But Gay`)
					.setImage("attachment://gay.png")
					.toJSON()
			]
		}, {
			name: "gay.png",
			file: img.file
		});
	});
