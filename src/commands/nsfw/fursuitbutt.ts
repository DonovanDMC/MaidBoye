import Command from "@cmd/Command";
import ComponentHelper from "@util/components/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@req/Yiffy";
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
					.setColor("gold")
					.toJSON()
			],
			components: new ComponentHelper(3)
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton("https://report.yiff.media", true, undefined, "Report")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `fursuitbutt-newimg.${msg.author.id}`, false, undefined, "New Image")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit-2.${msg.author.id}`, false, undefined, "Exit")
				.toJSON()
		});
	});
