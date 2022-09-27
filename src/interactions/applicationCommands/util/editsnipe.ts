import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import db from "../../../db/index.js";
import Util from "../../../util/Util.js";
import { TextableGuildChannelsWithThreads } from "../../../util/Constants.js";
import type { EditSnipe } from "../../../util/@types/misc.js";
import EncryptionHandler from "../../../util/handlers/EncryptionHandler.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, MessageFlags } from "oceanic.js";

export default new Command(import.meta.url, "editsnipe")
    .setDescription("Get the last edited message in a channel")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
            .setDescription("The channel to snipe from")
            .setChannelTypes(TextableGuildChannelsWithThreads)
    )
    .setOptionsParser(interaction => ({
        channel: interaction.data.options.getChannelOption("channel")?.value || interaction.channelID
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction, { channel }) {
        const snipe = await db.redis.lpop(`snipe:edit:${channel}`);
        if (snipe === null) return interaction.reply({
            content: "H-hey! No snipes were found..",
            flags:   MessageFlags.EPHEMERAL
        });
        const d = JSON.parse(snipe) as EditSnipe;
        const len = await db.redis.llen(`snipe:edit:${channel}`);
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Edit Snipe")
                .setDescription([
                    `From <@!${d.author}> - Edited At ${Util.formatDiscordTime(d.time, "short-datetime", true)}`,
                    `Old Content: ${Strings.truncateWords(EncryptionHandler.decrypt(d.oldContent), 250, true)}`,
                    `New Content: ${Strings.truncateWords(EncryptionHandler.decrypt(d.newContent), 250, true)}`,
                    ""
                ].join("\n"))
                .setFooter(`UwU | ${len} Snipe${len === 1 ? "" : "s"} Remaining`)
                .toJSON(true)
        });
    });
