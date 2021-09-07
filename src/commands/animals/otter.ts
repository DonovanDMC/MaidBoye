import Command from "@cmd/Command";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import CheweyAPI from "@util/req/CheweyAPI";
import Eris from "eris";

export default new Command("otter")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a otter!")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
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
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `otter-newimg.${msg.author.id}`, false, undefined, "New Image")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${msg.author.id}`, false, undefined, "Exit")
				.toJSON()
		});
	});
