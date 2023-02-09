import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { ChannelTypeNames } from "../util/Names.js";
import { AuditLogActionTypes } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("channelCreate", async function channelCreateEvent(channel) {
    if (!("guildID" in channel)) {
        return;
    }
    const events = await LogEvent.getType(channel.guildID, LogEvents.CHANNEL_CREATE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Channel Created")
        .setColor(Colors.green)
        .addField("Channel Info", [
            `Name: **${channel.name}**`,
            `Type: **${ChannelTypeNames[channel.type]}**`,
            `Parent: **${channel.parentID === null ? "[NONE]" : `<#${channel.parentID}>`}**`,
            `NSFW: **${"nsfw" in channel ? (channel.nsfw ? "Yes" : "No") : "N/A"}**`,
            `SlowMode: **${"rateLimitPerUser" in channel ? Time.ms(channel.rateLimitPerUser * 1000, { words: true }) : ""}**`
        ].join("\n"), false);

    if (channel.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(channel.guild, AuditLogActionTypes.CHANNEL_CREATE, e => e.targetID === channel.id);
        if (entry?.user && entry.isRecent) {
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.tag})`, false);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
