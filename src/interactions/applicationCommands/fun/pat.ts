import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> pats ${text} on the head for being a good boi`,
    `<@!${author}> gently pats ${text}`
];
export default new Command(import.meta.url, "pat")
    .setDescription("pat someone's head")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to pat")
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
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : user ? `<@!${user}>` : text!);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Pat Pat")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .toJSON(true)
        });
    });
