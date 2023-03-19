import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> sneaks up being ${text}, and when they aren't looking, tackles them from behind in the biggest hug ever!`,
    `<@!${author}> gently wraps their arms around ${text}, giving them a big warm hug!`
];
export default new Command(import.meta.url, "hug")
    .setDescription("Hug someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to hug, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { text }, gConfig) {
        const r = strings(interaction.user.id, text);

        const embed = Util.makeEmbed(true, interaction.user)
            .setTitle("<3")
            .setDescription(r[Math.floor(Math.random() * r.length)]);
        const components: Array<MessageActionRow> = [];

        if (gConfig.settings.commandImages) {
            const { url, source } = await Util.getImage("hug", Util.isNSFW(interaction.channel));
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
