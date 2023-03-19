import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> has booped ${text}!\nOwO`,
    `<@!${author}> lightly pokes the nose of ${text}\nOwO`
];
export default new Command(import.meta.url, "boop")
    .setDescription("Boop someone's nose!")
    .setGuildLookup(true)
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to boop, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setExecutor(async function(interaction, { text }, gConfig) {
        const r = strings(interaction.user.id, text);

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
