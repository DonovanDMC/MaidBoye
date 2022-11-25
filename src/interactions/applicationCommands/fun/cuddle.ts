import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> has cuddled ${text}!\nAren't they cute?`,
    `<@!${author}> sneaks up behind ${text}, and cuddles them\nIsn't that sweet?`
];
export default new Command(import.meta.url, "cuddle")
    .setDescription("Cuddle someone ^w^")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to cuddle.")
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
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { user, text }, gConfig) {
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : (user ? `<@!${user}>` : text!));

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("Aww!")
            .setDescription(r[Math.floor(Math.random() * r.length)]);
        const components: Array<MessageActionRow> = [];

        if (gConfig.settings.commandImages) {
            const { url, source } = await Util.getImage("cuddle", Util.isNSFW(interaction.channel));
            embed.setImage(url);
            if (source) {
                components.push(Util.getSourceComponent(source));
            }
        }

        return interaction.reply({
            embeds: embed.toJSON(true),
            components
        });
    });
