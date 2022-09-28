import Command from "../../../util/cmd/Command.js";
import ImageGen from "../../../util/req/ImageGen.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "gay")
    .setDescription("Gayify someone")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to gayify")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user", false) || interaction.user
    }))
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction, { user }) {
        const img = await ImageGen.gay(user.avatarURL());

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${user.username} Is Gay`)
                .setImage("attachment://gay.png")
                .toJSON(true),
            files: [{
                contents: img.file,
                name:     "gay.png"
            }]
        });
    });
