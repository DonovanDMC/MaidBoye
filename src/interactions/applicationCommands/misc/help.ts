import Config from "../../../config/index.js";
import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";

export default new Command(import.meta.url, "help")
    .setDescription("Get some help")
    .setAck("ephemeral")
    .setExecutor(async function(interaction) {
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Help")
                .setDescription(`Hi! This \`help\` command exists mostly as a formality, all usable commands are listed in Discord's application command window. If you need any more help than that, you can visit our [Discord](${Config.discordLink}) server.`)
                .toJSON(true)
        });
    });
