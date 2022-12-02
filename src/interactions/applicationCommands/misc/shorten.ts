import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Yiffy from "../../../util/req/Yiffy.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";
import { APIError, YiffyErrorCodes } from "yiffy";

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
        void Yiffy.shortener.create(url, `Discord:${interaction.user.id}`, code, false)
            .then(short =>
                interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle("URL Shortened")
                        .setDescription(`Code: \`${short.code}\`\nShort URL: [${short.fullURL}](${short.fullURL})`)
                        .toJSON(true)
                }))
            .catch(err => {
                if (err instanceof APIError) {
                    if (err.code === YiffyErrorCodes.SHORTENER_INVALID_URL) {
                        return interaction.reply({ content: "H-hey! That url was invalid.." });
                    } else if (err.code === YiffyErrorCodes.SHORTENER_CODE_IN_USE) {
                        return interaction.reply({ content: "H-hey! That code is already in use.." });
                    } else {
                        return interaction.reply({ content: `Our api returned an unknown error.. \`${err.message}\` (${err.code ?? "no error code"})` });
                    }
                } else {
                    throw err;
                }
            });
    });
