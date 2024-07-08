import Config from "../../../config/index.js";
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
        let percent: number;
        // eslint-disable-next-line unicorn/prefer-ternary
        if (["242843345402069002", Config.clientID].includes(user.id)) {
            percent = 100;
        } else {
            percent = Number(BigInt(user.id) % 100n);
        }
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${user.tag}'s Gayness`)
                .setDescription(`**${user.tag}** is ${percent}% gay!`)
                .setThumbnail("https://assets.maidboye.cafe/Gay.png")
                .toJSON(true)
        });
    });
