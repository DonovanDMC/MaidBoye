import Command from "@cmd/Command";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";
import Eris from "eris";

export default new Command("fursuitbutt")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a fursuit butt")
	.setRestrictions("nsfw")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await Yiffy.furry.butts("json", 1);
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Fursuit Butt")
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
