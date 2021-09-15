import ComponentInteractionHandler from "./main";

ComponentInteractionHandler
	.registerHandler("general-exit", false, async function handler(interaction) {
		return interaction.editParent({
			components: []
		});
	}).registerHandler("general-exit-2", false, async function handler(interaction) {
		await interaction.acknowledge();
		const originalMessage = await interaction.getOriginalMessage();
		return interaction.editParent({
			// only remove the last row, which in this case has the exit
			components: originalMessage.components?.splice(0, -1) ?? []
		});
	});
