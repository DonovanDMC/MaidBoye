import Config from "../../../config/index.js";
import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

(global as unknown as { customGayrate: Record<string, number | undefined>; }).customGayrate = {
    [Config.clientID]:    100,
    "242843345402069002": 69,
    "339050872736579589": 69
};

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
        const val = (global as unknown as { customGayrate: Record<string, number | undefined>; }).customGayrate[user.id];
        // eslint-disable-next-line unicorn/prefer-ternary
        if (val) {
            percent = val;
        } else {
            percent = Number(BigInt(user.id) % 100n);
        }
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${user.tag}'s Gayness`)
                .setDescription(`**${user.tag}** is ${percent}% gay!`)
                .setThumbnail("https://assets.maid.gay/Gay.png")
                .toJSON(true)
        });
    });
