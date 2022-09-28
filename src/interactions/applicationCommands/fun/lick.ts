import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> licks ${text}\nUwU`,
    `<@!${author}> decides to make ${text}'s fur a little slimy...`
];
export default new Command(import.meta.url, "lick")
    .setDescription("Lick someone..")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to lick")
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
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : user ? `<@!${user}>` : text!);

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("<3")
            .setDescription(r[Math.floor(Math.random() * r.length)]);
        const components: Array<MessageActionRow> = [];

        if (gConfig.settings.commandImages) {
            const { url, source } = await Util.getImage("lick", Util.isNSFW(interaction.channel));
            embed.setImage(url);
            if (source) components.push(Util.getSourceComponent(source));
        }

        return interaction.reply({
            embeds: embed.toJSON(true),
            components
        });
    });
