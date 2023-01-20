import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { ChannelTypeNames } from "../util/Names.js";
import { AuditLogActionTypes, ChannelTypes, ThreadChannel } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("threadDelete", async function threadDeleteEvent(thread) {
    const events = await LogEvent.getType(thread.guildID, LogEvents.THREAD_DELETE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Thread Created")
        .setColor(Colors.green)
        .addField("Thread Info", (thread instanceof ThreadChannel ? [
            `Thread: **${thread.name}** (${thread.id})`,
            `Owner: **${(await this.getUser(thread.ownerID))!.tag}** (${thread.ownerID})`,
            `Parent: <#${thread.parentID}>`,
            `Rate Limit Per User: **${Time.ms(thread.rateLimitPerUser * 1000, { words: true })}**`,
            `Type: **${ChannelTypeNames[thread.type]}**`,
            "",
            "**Thread Metadata**",
            `Archive Timestamp: ${Util.formatDiscordTime(thread.threadMetadata.archiveTimestamp, "short-datetime")}`,
            `Archived: **${thread.threadMetadata.archived ? "Yes" : "No"}**`,
            `Auto Archive Duration: **${Time.ms(thread.threadMetadata.autoArchiveDuration * 1000, { words: true })}**`,
            `Create Timestamp: ${thread.threadMetadata.createTimestamp === null ? "**Unknown**" : Util.formatDiscordTime(thread.threadMetadata.createTimestamp, "short-datetime")}`,
            `Locked: **${thread.threadMetadata.locked ? "Yes" : "No"}**`,
            `Invitable: **${thread.type === ChannelTypes.PRIVATE_THREAD ? (thread.threadMetadata.invitable ? "Yes" : "No") : "N/A"}**`
        ] : [
            `ID: **${thread.id}**`,
            `Parent: <#${thread.parentID}>`,
            "No other information is available."
        ]).join("\n"), false);

    if (thread.guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(thread.guild, AuditLogActionTypes.THREAD_DELETE, e => e.targetID === thread.id);
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
