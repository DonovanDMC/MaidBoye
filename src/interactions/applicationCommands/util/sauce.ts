import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Sauce from "../../../util/Sauce.js";
import StatsHandler from "../../../util/StatsHandler.js";
import { assert } from "tsafe";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "sauce")
    .setDescription("Get the sauce for an image")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "url")
            .setDescription("Get the source for a url")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "url")
                    .setDescription("The url to source")
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "simularity")
                    .setDescription("Set the simularity required for a result to be considered")
                    .setMinMax(1, 100)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "file")
            .setDescription("Get the source for a file")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.ATTACHMENT, "file")
                    .setDescription("The file to source")
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "simularity")
                    .setDescription("Set the simularity required for a result to be considered")
                    .setMinMax(1, 100)
            )
    )
    .setOptionsParser(interaction => ({
        type:       interaction.data.options.getSubCommand<["file" | "url"]>(true),
        url:        interaction.data.options.getString("url"),
        file:       interaction.data.options.getAttachment("file"),
        simularity: interaction.data.options.getInteger("simularity") || 75
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { type: [type], url: inputURL, file, simularity }) {
        let sauce: Awaited<ReturnType<typeof Sauce>> = null;
        if (type === "url") {
            assert(inputURL);
            sauce = await Sauce(inputURL, simularity);
        } else if (type === "file") {
            assert(file);
            sauce = await Sauce(file.url, simularity);
        }

        if (sauce === null) {
            return interaction.reply({ content: "Something failed.." });
        }
        const { method, tried, post, saucePercent, sourceOverride, snRateLimited, url } = sauce;
        if (snRateLimited) {
            StatsHandler.track("SAUCE_RATELIMITED", simularity, tried);
            return interaction.reply({ content: `SauceNAO is ratelimiting us, so we couldn't try SauceNAO, but we tried these instead, and couldn't find anything: \`${tried.join("`, `") || "`NONE`"}\`` });
        }
        if (method) {
            StatsHandler.track("SAUCE_SUCCESS", simularity, method);
        }
        switch (method) {
            case "e621": {
                assert(post);
                return interaction.reply({ content: `We found these sources via direct md5 lookup on e621\nLookup: <${url}>\n\nResults:\nhttps://e621.net/posts/${post.id}\n${post.sources.map(v => `<${v}>`).join("\n")}` });
            }

            case "yiffy2": {
                return interaction.reply({ content: `We found these sources via direct md5 lookup on YiffyAPI V2\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride!]).map((v, i) => i === 0 ? v : `<${v}>`).join("\n")}` });
            }
            case "saucenao": {
                return interaction.reply({ content: `We found these sources via a reverse image search on saucenao (simularity: ${saucePercent}%)\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride!]).map((v, i) => (i === 0 ? v : `<${v}>`).replace(/posts\/show/, "posts" /* legacy */)).join("\n")}` });
            }
            default: {
                StatsHandler.track("SAUCE_FAIL", simularity, tried);
                return interaction.reply({ content: `We tried our best, but couldn't find anything...\nAttempted Methods: \`${tried.join("`, `") || "`NONE`"}\`\n\nNote: We automatically remove any saucenao results with less than 75% simularity to avoid false positives, to set your own thresold, use the \`simularity\` option.` });
            }
        }
    });
