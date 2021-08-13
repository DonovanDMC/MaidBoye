import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import CheweyAPI from "@util/req/CheweyAPI";
import Eris from "eris";

export default new Command("owl")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a owl!")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await CheweyAPI.owl();
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Hoot Hoot!")
					.setImage(img)
					.toJSON()
			]
		});
	});
