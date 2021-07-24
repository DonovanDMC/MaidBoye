import Command from "@cmd/Command";
import config from "@config";
import EmbedBuilder from "@util/EmbedBuilder";

export default new Command("donate")
	.setPermissions("bot", "embedLinks")
	.setDescription("support us, if you feel like it..")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Donate")
					.setAuthor("Maid Boye", config.images.bot, config.client.links.kofi)
					.setDescription(`[Donate At Ko-Fi](${config.client.links.kofi})`)
					.setImage("https://cdn.ko-fi.com/cdn/kofi1.png?v=2")
					.toJSON()
			]
		});
	});
