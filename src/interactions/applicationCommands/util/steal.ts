import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import RequestProxy from "../../../util/RequestProxy.js";
import Util from "../../../util/Util.js";
import { Strings } from "@uwu-codes/utils";
import {
    ApplicationCommandOptionTypes,
    DiscordRESTError,
    type GuildEmoji,
    JSONErrorCodes,
    type Sticker
} from "oceanic.js";
import assert from "node:assert";
import { basename } from "node:path";
import { STATUS_CODES } from "node:http";

export default new Command(import.meta.url, "steal")
    .setDescription("Steal an emoji for this server, or create one from a url")
    .setPermissions("user", "MANAGE_EMOJIS_AND_STICKERS")
    .setPermissions("bot", "MANAGE_EMOJIS_AND_STICKERS")
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, "emoji")
        .setDescription("Create an emoji from an emoji, url, or file")
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "emoji-or-url")
                .setDescription("Create an emoji from an emoji or url")
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "emoji-or-url")
                        .setDescription("The emoji or url to use")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                        .setDescription("The name for the emoji (default: original emoji name or filename)")
                )
        )
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "file")
                .setDescription("Create an emoji from a file")
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.ATTACHMENT, "file")
                        .setDescription("The file to use")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                        .setDescription("The name for the emoji (default: original emoji name or filename)")
                )
        )
    )
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, "sticker")
        .setDescription("Create a sticker from an emoji, url, or file")
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "emoji-or-url")
                .setDescription("Create a sticker from an emoji or url")
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "emoji-or-url")
                        .setDescription("The emoji or url to use")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                        .setDescription("The name for the sticker")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "tags")
                        .setDescription("The tags (built-in emoji names) for the sticker, comma separated")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "description")
                        .setDescription("The description for the sticker")
                )
        )
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "file")
                .setDescription("Create a sticker from a file")
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.ATTACHMENT, "file")
                        .setDescription("The file to use (512kb max)")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                        .setDescription("The name for the sticker")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "tags")
                        .setDescription("The tags (built-in emoji names) for the sticker, comma separated")
                        .setRequired()
                )
                .addOption(
                    new Command.Option(ApplicationCommandOptionTypes.STRING, "description")
                        .setDescription("The description for the sticker")
                )
        )
    )
    .setOptionsParser(interaction => ({
        emojiOrURL:  interaction.data.options.getString("emoji-or-url"),
        file:        interaction.data.options.getAttachment("file"),
        name:        interaction.data.options.getString("name"),
        description: interaction.data.options.getString("description"),
        tags:        interaction.data.options.getString("tags"),
        type:        interaction.data.options.getSubCommand<["emoji" | "sticker", "emoji-or-url" | "file"]>(true)
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { emojiOrURL, file, name, description, tags, type: [outputType, inputType] }) {
        let url: string | undefined;
        if (file) {
            url = file.url;
        }
        switch (inputType) {
            case "emoji-or-url": {
                assert(emojiOrURL);
                let match: RegExpExecArray | null;
                if ((match = /<(a)?:.{2,32}:(\d{15,21})>/.exec(emojiOrURL.trim()))) {
                    url = `https://cdn.discordapp.com/emojis/${match[2]}.${match[1] === "a" ? "gif" : "png"}`;
                } else if (Strings.validateURL(emojiOrURL)) {
                    url = emojiOrURL;
                }
                break;
            }

            case "file": {
                assert(file);
                url = file.url;
            }
        }
        if (!url) {
            return interaction.reply({ content: "H-hey! A valid emoji, url, or file is required.." });
        }
        const head = await RequestProxy.head(url);
        if (head.status !== 200 && head.status !== 204) {
            return interaction.reply({ content: `A pre-check failed when trying to fetch the image "${url}".\nA \`HEAD\` request returned a non 200 OK/204 No Content responses (${head.status} ${STATUS_CODES[head.status] || "UNKNOWN"})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.` });
        }
        switch (outputType) {
            case "emoji": {
                if (!name) {
                    name = basename(new URL(url).pathname) || "unnamed";
                    console.log(name);
                    if (/.*\..+/.test(name)) {
                        name = name.split(".").slice(0, -1).join(".");
                    }
                }
                name = Strings.truncate(name, 32);
                const buf = Buffer.from(await (await RequestProxy.get(url)).response.arrayBuffer());
                let emoji: GuildEmoji;
                try {
                    emoji = await interaction.guild.createEmoji({
                        name,
                        image: buf
                    });
                } catch (err) {
                    assert(Util.is<Error>(err));
                    if (err instanceof DiscordRESTError) {
                        if (err.code === JSONErrorCodes.INVALID_FORM_BODY || err.code === JSONErrorCodes.FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE) {
                            return interaction.reply({ content: "H-hey! The file was too large, please try again with a smaller file..\n(try 256kb or less)" });
                        }
                        if (err.code === JSONErrorCodes.MAXIMUM_NUMBER_OF_EMOJIS) {
                            return interaction.reply({ content: "H-hey! This server already has the maximum amount of emojis.." });
                        }
                        if (err.code === JSONErrorCodes.MAXIMUM_NUMBER_OF_ANIMATED_EMOJIS) {
                            return interaction.reply({ content: "H-hey! This server already has the maximum amount of animated emojis.." });
                        }
                    }
                    return interaction.reply({ content: `H-hey! An error occured while creating the emoji..\n${err.name}: ${err.message}` });
                }

                return interaction.reply({ content: `Successfully created the emoji **${emoji.name}** <${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` });
            }

            case "sticker": {
                assert(name && tags);
                let sticker: Sticker;
                try {
                    sticker = await interaction.guild.createSticker({
                        name,
                        description: description || "",
                        tags,
                        file:        {
                            contents: Buffer.from(await (await RequestProxy.get(url)).response.arrayBuffer()),
                            name:     basename(new URL(url).pathname) || "sticker"
                        }
                    });
                } catch (err) {
                    assert(Util.is<Error>(err));
                    if (err instanceof DiscordRESTError) {
                        if (err.code === JSONErrorCodes.INVALID_FORM_BODY || err.code === JSONErrorCodes.FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE) {
                            return interaction.reply({ content: "H-hey! The file was too large, please try again with a smaller file..\n(try 512kb or less)" });
                        }
                        if (err.code === JSONErrorCodes.MAXIMUM_NUMBER_OF_STICKERS) {
                            return interaction.reply({ content: "H-hey! This server already has the maximum amount of stickers.." });
                        }
                    }
                    return interaction.reply({ content: `H-hey! An error occured while creating the sticker..\n${err.name}: ${err.message}` });
                }
                return interaction.reply({
                    content: `Successfully created the sticker **${sticker.name}**`
                });
            }
        }
    });
