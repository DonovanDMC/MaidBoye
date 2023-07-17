import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import Config from "../config/index.js";
import EncryptionHandler from "../util/handlers/EncryptionHandler.js";
import type { BulkDeleteReport } from "../util/@types/misc.js";
import { type AnyTextableGuildChannel, AuditLogActionTypes, type Message, type Uncached } from "oceanic.js";
import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

// this requires the messageContent intent
export default new ClientEvent("messageDeleteBulk", async function messageDeleteBulkEvent(messages) {
    const guild = (messages.find(msg  => "guildID" in msg) as Message<Uncached | AnyTextableGuildChannel>)?.guild;
    if (!guild) {
        return;
    }

    const time = Date.now();
    const channel = (await this.getGuildChannel(messages[0]!.channelID))!;
    const report: BulkDeleteReport = {
        channel:      [channel.id, EncryptionHandler.encrypt(channel.name)],
        createdAt:    time,
        expiresAt:    time + 2592000000, // expires after 30 days
        guild:        [guild.id, EncryptionHandler.encrypt(guild.name)],
        messageCount: messages.length,
        messages:     messages.map(m => {
            const author = EncryptionHandler.encrypt("author" in m ? `${m.author.tag} (${m.author.id})` : "Unknown Author");
            const d = Number((BigInt(m.id) / 4194304n) + 1420070400000n);
            return {
                author,
                content:   "content" in m ? EncryptionHandler.encrypt(m.content) : null,
                timestamp: d
            };
        })
    };
    const events = await LogEvent.getType(guild.id, LogEvents.MESSAGE_DELETE_BULK);
    if (events.length === 0) {
        return;
    }

    const id = randomBytes(16).toString("hex");
    await writeFile(`${Config.bulkDeleteDir}/${id}.json`, JSON.stringify(report));
    const embed = Util.makeEmbed(true)
        .setTitle("Bulk Message Deletion")
        .setDescription([
            `Channel: ${channel.mention}`,
            `Total Deleted: **${messages.length}**`,
            `Report: [here](${Config.apiURL}/bulk-delete/${id})`
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
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
