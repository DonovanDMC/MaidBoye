import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "russianroulette")
    .setDescription("Play russian roulette")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "bullets")
            .setDescription("The total bullets in the chamber")
            .setMinMax(1, 6)
    )
    .setOptionsParser(interaction => ({
        bullets: interaction.data.options.getInteger("bullets") || 3
    }))
    .setExecutor(async function(interaction, { bullets }) {
        return interaction.reply({ content: `You ${(Math.floor(Math.random() * 6)) <= (bullets - 1) ? "died.." : "lived!"}` });
    });
