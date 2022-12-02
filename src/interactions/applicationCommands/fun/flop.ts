import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> flops over onto ${text}\nuwu`,
    `<@!${author}> lays on ${text}.. owo`
];
export default new Command(import.meta.url, "flop")
    .setDescription("Flop on to someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to flop on.")
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
        if (!user && !text) {
            return interaction.reply({
                flags:   MessageFlags.EPHEMERAL,
                content: "H-hey! You have to specify a user or some text.."
            });
        }
        return "command-images-check";
    })
    .setExecutor(async function(interaction, { user, text }) {
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : (user ? `<@!${user}>` : text!));

        const img = await Yiffy.images.furry.flop();

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Zzzzz...")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .setImage(img.url)
                .toJSON(true)
        });
    });
