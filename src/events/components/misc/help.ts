import ComponentInteractionHandler from "../main";
import { getInfo } from "@commands/misc/help";
import BotFunctions from "@util/BotFunctions";

ComponentInteractionHandler
	.registerHandler("help-home", false, async function handler(interaction) {
		const id = interaction.data.custom_id.split(".")[1];
		if (!id) return interaction.editParent(BotFunctions.replaceContent("Missing Information."));
		try {
			const msg = interaction.channel.messages.get(id) ?? await interaction.channel.getMessage(id);
			const { home } = getInfo.call(this, msg);
			return interaction.editParent(home);
		} catch {
			return interaction.editParent(BotFunctions.replaceContent("Missing Information."));
		}
	})
	.registerHandler("help-category-", false, async function handler(interaction) {
		const id = interaction.data.custom_id.split(".")[1];
		if (!id) return interaction.editParent(BotFunctions.replaceContent("Missing Information."));
		try {
			const msg = interaction.channel.messages.get(id) ?? await interaction.channel.getMessage(id);
			const cat = interaction.data.custom_id.split(".")[0].split("-")[2];
			const { categories } = getInfo.call(this, msg);
			return interaction.editParent(categories[cat]);
		} catch {
			return interaction.editParent(BotFunctions.replaceContent("Missing Information."));
		}
	});
