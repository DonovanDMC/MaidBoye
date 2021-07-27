import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import CheweyAPI from "@util/req/CheweyAPI";

export default new Command("otter")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a otter!")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await CheweyAPI.otter();
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Cuuuute!")
					.setImage(img)
					.toJSON()
			]
		});
	});
