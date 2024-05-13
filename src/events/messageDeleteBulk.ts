import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { type AnyTextableGuildChannel, AuditLogActionTypes, type Message, type Uncached, Base } from "oceanic.js";

// this requires the messageContent intent
export default new ClientEvent("messageDeleteBulk", async function messageDeleteBulkEvent(messages) {
    const guild = (messages.find(msg  => "guildID" in msg) as Message<Uncached | AnyTextableGuildChannel>)?.guild;
    if (!guild) {
        return;
    }

    const channel = (await this.getGuildChannel(messages[0]!.channelID))!;
    const events = await LogEvent.getType(guild.id, LogEvents.MESSAGE_DELETE_BULK);
    if (events.length === 0) {
        return;
    }

    const text = [
        "-- Begin Bulk Deletion Report --",
        `Total Messages: ${messages.length}`,
        `Server: ${guild.name} (${guild.id})`,
        `Channel: ${channel.name} (${channel.id})`,
        "",
        "-- Begin Messages --",
        ...messages.map(msg => `[${Base.getCreatedAt(msg.id).toUTCString()}][${"author" in msg ? msg.author.tag : "Unknown Author"}]: ${"content" in msg ? msg.content : "[No Content]"}`),
        "-- End Messages --",
        "",
        "-- Begin Disclaimers --",
        "* If you do not want bulk delete reports to be made, disable logging for Bulk Message Delete.",
        "-- End Disclaimers --",
        "-- End Bulk Deletion Report --"
    ].join("\n");

    const embed = Util.makeEmbed(true)
        .setTitle("Bulk Message Deletion")
        .setDescription([
            `Channel: ${channel.mention}`,
            `Total Deleted: **${messages.length}**`
        ])
        .setColor(Colors.red);

    if (guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        // @TODO ensure this works
        const entry = Util.getAuditLogEntry(guild, AuditLogActionTypes.MESSAGE_BULK_DELETE, e => e.targetID === channel.id);
        if (entry?.user && entry.isRecent) {
            embed.addField("Blame", `${entry.user.tag} (${entry.user.id})`, false);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true), files: [{ name: "report.txt", contents: Buffer.from(text) }] });
    }
});
