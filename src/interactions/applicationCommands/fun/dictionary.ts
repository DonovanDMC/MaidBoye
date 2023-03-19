import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> throws a dictionary at ${text} screaming "KNOWLEDGE"!`,
    `<@!${author}> drops some knowledge on ${text}, with their dictionary!`,
    `<@!${author}> drops their entire English folder onto ${text}, it seems to have flattened them!`
];
export default new Command(import.meta.url, "dictionary")
    .setDescription("Throw the dictionary at someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to throw a dictionary at, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setExecutor(async function(interaction, { text }) {
        const r = strings(interaction.user.id, text);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Bap!")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .toJSON(true)
        });
    });
