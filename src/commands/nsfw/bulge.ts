import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@req/Yiffy";
import Eris from "eris";
import ComponentHelper from "@util/components/ComponentHelper";

export default new Command("bulge")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Bolgy wolgy uwu")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setRestrictions("nsfw")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await Yiffy.furry.bulge("json", 1);
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Bolgy Wolgy UwU")
					.setImage(img.url)
					.setColor("gold")
					.toJSON()
			],
			components: new ComponentHelper(3)
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton(img.reportURL, false, undefined, "Report")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `bulge-newimg.${msg.author.id}`, false, undefined, "New Image")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit-2.${msg.author.id}`, false, undefined, "Exit")
				.toJSON()
		});
	});
