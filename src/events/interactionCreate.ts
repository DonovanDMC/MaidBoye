import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import Eris from "eris";

export default new ClientEvent("interactionCreate", async function(interaction) {
	if (interaction instanceof Eris.UnknownInteraction) {
		Logger.getLogger("Unknown Interaction").warn("Type:", interaction.type);
		return;
	}
	await interaction.acknowledge();
	switch (interaction.type) {
		case Eris.Constants.InteractionTypes.SLASH_COMMAND: {
			return interaction.createFollowup({
				content: "Slash Commands have not been set up yet.",
				flags: 64
			});
			break;
		}

		case Eris.Constants.InteractionTypes.MESSAGE_COMPONENT: {
			Logger.getLogger("MessageInteraction").info(`Recieved interaction from ${!interaction.member ? "Unknown" : `${interaction.member.tag} (${interaction.member.id})`}, interaction id: "${interaction.data.custom_id}"`);
			break;
		}
	}
});
