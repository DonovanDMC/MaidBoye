import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> has cuddled ${text}!\nAren't they cute?`,
    `<@!${author}> sneaks up behind ${text}, and cuddles them\nIsn't that sweet?`
];
export default new Command(import.meta.url, "cuddle")
    .setDescription("Cuddle someone ^w^")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to cuddle, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setAck("command-images-check")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { text }, gConfig) {
        const r = strings(interaction.user.id, text);

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
