import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> pounces onto ${text} uwu`
];
export default new Command(import.meta.url, "pounce")
    .setDescription("Pounce onto someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to pounce on, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setExecutor(async function(interaction, { text }) {
        const r = strings(interaction.user.id, text);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("C'mere~")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .toJSON(true)
        });
    });
