import ComponentInteractionHandler from "../main";
import Yiffy from "@req/Yiffy";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/components/ComponentHelper";

ComponentInteractionHandler
	.registerHandler("fursuitbutt-newimg", false, async function handler(interaction) {
		const img = await Yiffy.furry.butts("json", 1);
		return interaction.editParent({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle("Fursuit Butt")
					.setImage(img.url)
					.setColor("gold")
					.toJSON()
			],
			components: new ComponentHelper(3)
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton(img.reportURL, false, undefined, "Report")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `fursuitbutt-newimg.${interaction.member.id}`, false, undefined, "New Image")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit-2.${interaction.member.id}`, false, undefined, "Exit")
				.toJSON()
		});
	});
