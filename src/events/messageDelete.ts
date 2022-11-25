import ClientEvent from "../util/ClientEvent.js";
import ModLog from "../db/Models/ModLog.js";
import db from "../db/index.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import EncryptionHandler from "../util/handlers/EncryptionHandler.js";
import { Strings } from "@uwu-codes/utils";
import { AuditLogActionTypes, Message } from "oceanic.js";

// this requires the messageContent intent
export default new ClientEvent("messageDelete", async function messageDeleteEvent(msg) {
    if (!("guildID" in msg) || !msg.guildID || !(msg instanceof Message)) {
        return;
    }
    // if the message gets deleted, we remove the message from the case
    const modCase = await ModLog.getFromMessage(msg.guildID, msg.id);
    if (modCase) {
        await modCase.edit({ message_id: null });
    }

    if (msg.content !== "") {
        await db.redis
            .multi()
            .lpush(`snipe:delete:${msg.channelID}`, JSON.stringify({
                content: EncryptionHandler.encrypt(msg.content),
                author:  msg.author.id,
                time:    Date.now(),
                ref:     msg.referencedMessage ? {
                    link:    msg.referencedMessage.jumpLink,
                    author:  msg.referencedMessage.author.id,
                    content: EncryptionHandler.encrypt(msg.referencedMessage.content)
                } : null
            }))
            .ltrim(`snipe:delete:${msg.channelID}`, 0, 2)
            .expire(`snipe:delete:${msg.channelID}`, 21600)
            .exec();
    }

    const events = await LogEvent.getType(msg.guildID, LogEvents.MESSAGE_DELETE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true, msg.author)
        .setTitle("Message Deleted")
        .setColor(Colors.red)
        .addField("Content", Strings.truncate(msg.content || "[No Content]", 1000), false);

    if (msg.guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await msg.guild.getAuditLog({
            actionType: AuditLogActionTypes.MESSAGE_DELETE,
            limit:      50
        });
        const entry = auditLog.entries[0];
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
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
