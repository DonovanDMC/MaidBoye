import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> kisses ${text}, how cute!`
];
export default new Command(import.meta.url, "kiss")
    .setDescription("Kiss someone..!")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to kiss")
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
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { user, text }, gConfig) {
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : (user ? `<@!${user}>` : text!));

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("Smooch!")
            .setDescription(r[Math.floor(Math.random() * r.length)]);
        const components: Array<MessageActionRow> = [];

        if (gConfig.settings.commandImages) {
            const { url, source } = await Util.getImage("kiss", Util.isNSFW(interaction.channel));
            embed.setImage(url);
            if (source) components.push(Util.getSourceComponent(source));
        }

        return interaction.reply({
            embeds: embed.toJSON(true),
            components
        });
    });
