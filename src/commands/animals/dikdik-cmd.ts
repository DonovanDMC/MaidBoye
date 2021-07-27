import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";

export default new Command("dikdik")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a dikdik!")
	.setHasSlashVariant(true)
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
