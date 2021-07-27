import Command from "@cmd/Command";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";

export default new Command("fursuit")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a fursuit")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const butt = msg.args[0] === "butt";
		let img = await Yiffy.furry.fursuit("json", 1);
		if (butt) {
			if (!msg.channel.nsfw) return msg.reply("H-hey! That has to be used in an nsfw channel..");
			img = await Yiffy.furry.butts("json", 1);
		}
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`Fursuit${butt ? " Butt" : ""}`)
					.setImage(img.url)
					.toJSON()
			],
			components: new ComponentHelper()
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton(img.reportURL, false, undefined, "Report")
				.toJSON()
		});
	});
