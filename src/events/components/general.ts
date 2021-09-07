import ComponentInteractionHandler from "./main";

ComponentInteractionHandler
	.registerHandler("general-exit", false, async function handler(interaction) {
		return interaction.editParent({
			components: []
		});
	});
