import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import CheweyAPI from "@util/req/CheweyAPI";
import Yiffy from "@util/req/Yiffy";
import Eris from "eris";

export default new Command("birb")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get an image of a birb!")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const img = await (Math.random() > .5 ? Yiffy.animals.birb("json", 1).then(y => y.url) : CheweyAPI.birb());
		if (!img) return msg.reply("The image api returned an error..");
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Birb!")
					.setImage(img)
					.toJSON()
			]
		});
	});
