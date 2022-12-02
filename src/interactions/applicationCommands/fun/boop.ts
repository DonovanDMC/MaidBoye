import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> has booped ${text}!\nOwO`,
    `<@!${author}> lightly pokes the nose of ${text}\nOwO`
];
export default new Command(import.meta.url, "boop")
    .setDescription("Stick your tongue out!")
    .setGuildLookup(true)
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to boop.")
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
        return interaction.defer();
    })
    .setExecutor(async function(interaction, { user, text }, gConfig) {
        const r = strings(interaction.user.id, user && text ? `<@!${user}> ${text}` : (user ? `<@!${user}>` : text!));

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("Boop!")
            .setDescription(r[Math.floor(Math.random() * r.length)]);

        if (gConfig.settings.commandImages) {
            if (!interaction.channel.permissionsOf(this.user.id).has("ATTACH_FILES")) {
                return interaction.reply({
                    flags:   MessageFlags.EPHEMERAL,
                    content: "H-hey! This server has the **Command Images** setting enabled, but I cannot attach files.. Please correct this."
                });
            }
            const img = await Yiffy.images.furry.boop();
            embed.setImage(img.url);
        }

        return interaction.reply({
            embeds: embed.toJSON(true)
        });
    });
