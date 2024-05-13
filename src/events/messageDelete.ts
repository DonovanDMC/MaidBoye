import ClientEvent from "../util/ClientEvent.js";
import ModLog from "../db/Models/ModLog.js";
import db from "../db/index.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import EncryptionHandler from "../util/handlers/EncryptionHandler.js";
import GuildConfig from "../db/Models/GuildConfig.js";
import UserConfig from "../db/Models/UserConfig.js";
import { Strings } from "@uwu-codes/utils";
import { AuditLogActionTypes, Message } from "oceanic.js";

// this requires the messageContent intent
export default new ClientEvent("messageDelete", async function messageDeleteEvent(message) {
    if (!("guildID" in message) || !message.guildID || !(message instanceof Message)) {
        return;
    }
    // if the message gets deleted, we remove the message from the case
    const modCase = await ModLog.getFromMessage(message.guildID, message.id);
    if (modCase) {
        await modCase.edit({ message_id: null });
    }

    snipe: if (message.content !== "") {
        const gConfig = await GuildConfig.get(message.guildID, false);
        const uConfig = await UserConfig.get(message.author.id, false);
        if (gConfig?.settings.snipeDisabled || uConfig?.preferences.disableSnipes) {
            break snipe;
        }
        await db.redis
            .multi()
            .lpush(`snipe:delete:${message.channelID}`, EncryptionHandler.encrypt(JSON.stringify({
                content: message.content,
                author:  message.author.id,
                time:    Date.now(),
                ref:     message.referencedMessage ? {
                    link:    message.referencedMessage.jumpLink,
                    author:  message.referencedMessage.author.id,
                    content: message.referencedMessage.content
                } : null
            })))
            .ltrim(`snipe:delete:${message.channelID}`, 0, 2)
            .expire(`snipe:delete:${message.channelID}`, 21600)
            .exec();
    }

    const events = await LogEvent.getType(message.guildID, LogEvents.MESSAGE_DELETE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true, message.author)
        .setTitle("Message Deleted")
        .setColor(Colors.red)
        .addField("Content", Strings.truncate(message.content || "[No Content]", 1000), false);

    if (message.guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(message.guild, AuditLogActionTypes.MESSAGE_DELETE, e => e.targetID === message.id);
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
