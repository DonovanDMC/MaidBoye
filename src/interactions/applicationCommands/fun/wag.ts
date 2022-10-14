import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "whosagoodboi")
    .setDescription("Who's a good boi?!?")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to depict as a good boi")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUserOption("user")?.value || interaction.user.id
    }))
    .setExecutor(async function(interaction, { user }) {
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Who's A Good Boi?!?")
                .setDescription(!user ? "You are! You're a good boi!" : (user === this.user.id ? "N-no! I am NOT a good boi.. nwn" : `<@!${user}> is a good boi!`))
                .toJSON(true)
        });
    });
