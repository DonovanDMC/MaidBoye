import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> licks ${text}\nUwU`,
    `<@!${author}> decides to make ${text}'s fur a little slimy...`
];
export default new Command(import.meta.url, "lick")
    .setDescription("Lick someone~")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to lick, and any other spicy text you want~!")
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
            const { url, source } = await Util.getImage("lick", Util.isNSFW(interaction.channel));
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
