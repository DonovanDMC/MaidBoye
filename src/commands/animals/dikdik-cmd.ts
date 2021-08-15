import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";
import Eris from "eris";

export default new Command("dikdik")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a dikdik!")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await Yiffy.animals.dikdik("json", 1);
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Dik-Dik!")
					.setImage(img.url)
					.toJSON()
			]
		});
	});
