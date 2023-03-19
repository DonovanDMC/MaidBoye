import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> kisses ${text}, how cute!`
];
export default new Command(import.meta.url, "kiss")
    .setDescription("Kiss someone >w>")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to kiss, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { text }, gConfig) {
        const r = strings(interaction.user.id, text);

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("Smooch!")
            .setDescription(r[Math.floor(Math.random() * r.length)]);
        const components: Array<MessageActionRow> = [];

        if (gConfig.settings.commandImages) {
            const { url, source } = await Util.getImage("kiss", Util.isNSFW(interaction.channel));
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
