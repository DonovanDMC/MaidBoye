import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import YiffRocks, { APIError } from "yiff-rocks";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

export default new Command(import.meta.url, "shorten")
    .setDescription("Shorten a url, using our shortener: yiff.rocks")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "url")
            .setDescription("The url to shorten")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "code")
            .setDescription("The short code to use (none for random)")
    )
    .setOptionsParser(async function (interaction) {
        return {
            url:  interaction.data.options.getString("url", true),
            code: interaction.data.options.getString("code")
        };
    })
    .setAck((interaction, { url }, ephemeralUser) => {
        if ((!url || !url.startsWith("http"))) {
            return interaction.createMessage({
                flags:   MessageFlags.EPHEMERAL,
                content: "H-hey! That wasn't a valid url.."
            });
        }
        return ephemeralUser ? interaction.defer(MessageFlags.EPHEMERAL) : interaction.defer();
    })
    .setCooldown(3e3)
    .setExecutor(async function(interaction, { url, code }) {
        void YiffRocks.create(url, `Discord:${interaction.user.id}`, code, false)
            .then(short =>
                interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle("URL Shortened")
                        .setDescription(`Code: \`${short.code}\`\nShort URL: [${short.fullURL}](${short.fullURL})`)
                        .toJSON(true)
                }))
            .catch(err => {
                if (err instanceof APIError) {
                    if (err.obj === "Invalid url proided.") {
                        return interaction.reply({ content: "H-hey! That url was invalid.." });
                    } else if (err.obj === "Code already in use.") {
                        return interaction.reply({ content: "H-hey! That code is already in use.." });
                    } else {
                        return interaction.reply({ content: `Our api returned an unknown error.. \`${err.message}\`${typeof err.obj === "string" ? "" : `, ${JSON.stringify(err.obj)}`}` });
                    }
                } else {
                    throw err;
                }
            });
    });
