import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, user: string) => [
    `<@!${author}> rubs the belly of <@!${user}>!`
];
export default new Command(import.meta.url, "bellyrub")
    .setDescription("Rub someone's belly")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to give a belly rub to.")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUserOption("user", true)?.value
    }))
    .setExecutor(async function(interaction, { user }) {
        const r = strings(interaction.user.id, user);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Belly Rubs!")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .setImage(Config.bellyrubGif)
                .setFooter("Don't go too low ~w~", Config.botIcon)
                .toJSON(true)
        });
    });
