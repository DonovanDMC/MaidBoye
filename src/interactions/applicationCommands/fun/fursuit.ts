import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";

export default new Command(import.meta.url, "fursuit")
    .setDescription("Get an image of a fursuit")
    .setCooldown(3e3)
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction) {
        return Util.handleGenericImage(interaction, interaction.data.name);
    });
