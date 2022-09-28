import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";

const strings = (author: string) => [
    `<@!${author}> did a little blep!`,
    `<@!${author}> stuck their tongue out cutely!`
];
export default new Command(import.meta.url, "blep")
    .setDescription("Stick your tongue out!")
    .setAck("command-images-check")
    .setGuildLookup(true)
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction) {
        const r = strings(interaction.user.id);
        const img = await Yiffy.animals.blep("json", 1);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Blep!")
                .setDescription(r[Math.floor(Math.random() * r.length)])
                .setImage(img.url)
                .toJSON(true)
        });
    });
