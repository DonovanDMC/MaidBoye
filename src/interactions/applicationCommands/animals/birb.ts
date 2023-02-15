import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";

export default new Command(import.meta.url, "birb")
    .setDescription("Get an image of a birb!")
    .setCooldown(1e4)
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction) {
        throw new Error("urgay");
        return Util.handleGenericImage(interaction, interaction.data.name);
    });
