import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> smacks ${text} hard on the snoot with a rolled up news paper!`,
    `<@!${author}> goes to smack ${text} on the snoot with a news paper, but missed and hit themself!`
];
export default new Command(import.meta.url, "bap")
    .setDescription("Bap someone on the snoot")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to bap.")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("Any extra text")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUserOption("user")?.value,
        text: interaction.data.options.getString("text")
    }))
    .setAck(async function(interaction, { user, text }) {
        if (!user && !text) return interaction.reply({
            flags:   MessageFlags.EPHEMERAL,
            content: "H-hey! You have to specify a user or some text.."
        });
        return interaction.defer();
    })
    .setExecutor(async function(interaction, { user, text }) {
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : (user ? `<@!${user}>` : text!));

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Bap!")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .setImage(Config.bapGif)
                .toJSON(true)
        });
    });
