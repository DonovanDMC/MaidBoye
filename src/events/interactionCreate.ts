import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import Eris from "eris";

export default new ClientEvent("interactionCreate", async function(interaction) {
	// @TODO waiting for the pr author to fix some issues in the pr
	// https://github.com/abalabahaha/eris/pull/1234
	return;
	/* await interaction.acknowledge();
	switch (interaction.type) {
		case Eris.Constants.InteractionTypes.slashCommand: {
			return interaction.createFollowup({
				content: "Slash Commands have not been set up yet.",
				flags: 64
			});
			break;
		}

		case Eris.Constants.InteractionTypes.messageComponent: {
			Logger.getLogger("MessageInteraction").info(`Recieved interaction from ${!interaction.member ? "Unknown" : `${interaction.member.tag} (${interaction.member.id})`}, interaction id: "${interaction.data!.custom_id!}"`);
			break;
		}
	} */
});
