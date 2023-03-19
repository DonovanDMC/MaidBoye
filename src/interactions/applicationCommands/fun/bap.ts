import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> smacks ${text} hard on the snoot with a rolled up news paper!`,
    `<@!${author}> goes to smack ${text} on the snoot with a news paper, but missed and hit themself!`
];
export default new Command(import.meta.url, "bap")
    .setDescription("Bap someone on the snoot")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to bap, and any other spicy text you want~!")
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
                .setImage(Config.bapGif)
                .toJSON(true)
        });
    });
