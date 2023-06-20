import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "gayrate")
    .setDescription("Rate someone's gayness")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to rate")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user", false) || interaction.user
    }))
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction, { user }) {
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${user.tag}'s Gayness`)
                .setDescription(`**${user.tag}** is ${Math.floor(Math.random() * 101)}% gay!`)
                .setThumbnail("https://assets.maidboye.cafe/Gay.png")
                .toJSON(true)
        });
    });
