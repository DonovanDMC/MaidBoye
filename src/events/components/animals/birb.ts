import ComponentInteractionHandler from "../main";
import CheweyAPI from "@req/CheweyAPI";
import Yiffy from "@req/Yiffy";
import BotFunctions from "@util/BotFunctions";
import EmbedBuilder from "@util/EmbedBuilder";

ComponentInteractionHandler
	.registerHandler("birb-newimg", false, async function handler(interaction) {
		await interaction.acknowledge();
		const img = await (Math.random() > .5 ? Yiffy.animals.birb("json", 1).then(y => y.url) : CheweyAPI.birb());
		if (!img) await interaction.editOriginalMessage(BotFunctions.replaceContent({
			content: "The image api returned an error.."
		}));
		else await interaction.editOriginalMessage({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle("Birb!")
					.setImage(img)
					.toJSON()
			]
		});
	});
