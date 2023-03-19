import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> sprays ${text} with a bottle of water, while yelling "bad fur"!`
];
export default new Command(import.meta.url, "spray")
    .setDescription("Spray someone with water")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to spray, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setExecutor(async function(interaction, { text }) {
        const r = strings(interaction.user.id, text);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Bad Fur! ${Config.emojis.custom.spray.repeat(3)}`)
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .toJSON(true)
        });
    });
