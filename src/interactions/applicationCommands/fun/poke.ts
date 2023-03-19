import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> pokes ${text}\nDon't make them mad..`
];
export default new Command(import.meta.url, "poke")
    .setDescription("poke someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to poke, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setExecutor(async function(interaction, { text }) {
        const r = strings(interaction.user.id, text);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Poke!")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .toJSON(true)
        });
    });
