import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

const strings = (author: string, text: string) => [
    `<@!${author}> flops over onto ${text}\nuwu`,
    `<@!${author}> lays on ${text}.. owo`
];
export default new Command(import.meta.url, "flop")
    .setDescription("Flop on to someone")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The person to flop on to, and any other spicy text you want~!")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text", true)
    }))
    .setAck("command-images-check")
    .setExecutor(async function(interaction, { text }) {
        const r = strings(interaction.user.id, text);

        const img = await Yiffy.images.furry.flop();

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Zzzzz...")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .setImage(img.url)
                .toJSON(true)
        });
    });
