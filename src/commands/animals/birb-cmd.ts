import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";

export default new Command("birb")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a birb!")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await Yiffy.animals.birb("json", 1);
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Birb!")
					.setImage(img.url)
					.toJSON()
			]
		});
	});
