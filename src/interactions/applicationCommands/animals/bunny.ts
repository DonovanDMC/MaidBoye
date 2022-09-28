import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";

export default new Command(import.meta.url, "bunny")
    .setDescription("Get an image of a bunny!")
    .setCooldown(1e4)
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction) {
        return Util.handleGenericImage(interaction, interaction.data.name);
    });