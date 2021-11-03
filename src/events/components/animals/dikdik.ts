import ComponentInteractionHandler from "../main";
import BotFunctions from "@util/BotFunctions";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@req/Yiffy";

ComponentInteractionHandler
	.registerHandler("dikdik-newimg", false, async function handler(interaction) {
		await interaction.acknowledge();
		const img = await Yiffy.animals.dikdik("json", 1);
		if (!img) await interaction.editOriginalMessage(BotFunctions.replaceContent({
			content: "The image api returned an error.."
		}));
		else await interaction.editOriginalMessage({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle("Dik-Dik!")
					.setImage(img.url)
					.toJSON()
			]
		});
	});
