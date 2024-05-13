import ClientEvent from "../util/ClientEvent.js";
import db from "../db/index.js";
import EncryptionHandler from "../util/handlers/EncryptionHandler.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import { Colors } from "../util/Constants.js";
import Util from "../util/Util.js";
import GuildConfig from "../db/Models/GuildConfig.js";
import UserConfig from "../db/Models/UserConfig.js";
import { type EmbedOptions, MessageFlags } from "oceanic.js";
import { Strings } from "@uwu-codes/utils";

// this requires the messageContent intent
export default new ClientEvent("messageUpdate", async function debugEvent(message, oldMessage) {
    if (!("guildID" in message) || !message.guildID || oldMessage === null) {
        return;
    }

    editsnipe: if (message.content !== oldMessage.content) {
        const gConfig = await GuildConfig.get(message.guildID, false);
        const uConfig = await UserConfig.get(message.author.id, false);
        if (gConfig?.settings.snipeDisabled || uConfig?.preferences.disableSnipes) {
            break editsnipe;
        }
        await db.redis
            .multi()
            .lpush(`snipe:edit:${message.channelID}`, EncryptionHandler.encrypt(JSON.stringify({
                newContent: message.content,
                oldContent: oldMessage.content,
                author:     message.author.id,
                time:       Date.now()
            })))
            .ltrim(`snipe:edit:${message.channelID}`, 0, 2)
            .expire(`snipe:edit:${message.channelID}`, 21600)
            .exec();
    }

    const events = await LogEvent.getType(message.guildID, LogEvents.MESSAGE_UPDATE);
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];

    if (oldMessage.content !== message.content) {
        embeds.push(Util.makeEmbed(true, message.author)
            .setTitle("Message Updated")
            .setColor(Colors.gold)
            .setDescription(`The message content was updated.\n\n[[Jump Link](${message.jumpLink})]`)
            .addField("Old Content", Strings.truncate(oldMessage.content || "[No Content]", 1000), false)
            .addField("New Content", Strings.truncate(message.content || "[Content Was Cleared]", 1000), false)
            .toJSON()
        );
    }

    const oldFlags = Util.getFlags(MessageFlags, oldMessage.flags ?? 0);
    const newFlags = Util.getFlags(MessageFlags, message.flags);
    if (oldMessage.flags !== message.flags) {
        if (!oldFlags.CROSSPOSTED && newFlags.CROSSPOSTED)  {
            embeds.push(Util.makeEmbed(true, message.author)
                .setTitle("Message Updated")
                .setColor(Colors.gold)
                .setDescription(`The message was crossposted.\n\n[[Jump Link](${message.jumpLink})]`)
                .toJSON()
            );
        }

        if (!oldFlags.SUPPRESS_EMBEDS && newFlags.SUPPRESS_EMBEDS)  {
            embeds.push(Util.makeEmbed(true, message.author)
                .setTitle("Message Updated")
                .setColor(Colors.gold)
                .setDescription(`The embeds of this message were suppressed.\n\n[[Jump Link](${message.jumpLink})]`)
                .toJSON()
            );
        }

        if (oldFlags.SUPPRESS_EMBEDS && !newFlags.SUPPRESS_EMBEDS)  {
            embeds.push(Util.makeEmbed(true, message.author)
                .setTitle("Message Updated")
                .setColor(Colors.gold)
                .setDescription(`The embeds of this message were unsuppressed.\n\n[[Jump Link](${message.jumpLink})]`)
                .toJSON()
            );
        }

        if (!oldFlags.SOURCE_MESSAGE_DELETED && newFlags.SOURCE_MESSAGE_DELETED)  {
            embeds.push(Util.makeEmbed(true, message.author)
                .setTitle("Message Updated")
                .setColor(Colors.gold)
                .setDescription(`The message this was replying to was deleted.\n\n[[Jump Link](${message.jumpLink})]`)
                .toJSON()
            );
        }

        if (!oldFlags.HAS_THREAD && newFlags.HAS_THREAD)  {
            embeds.push(Util.makeEmbed(true, message.author)
                .setTitle("Message Updated")
                .setColor(Colors.gold)
                .setDescription(`A thread was created with this message as its starter.\n\n[[Jump Link](${message.jumpLink})]`)
                .toJSON()
            );
        }
    }

    if (embeds.length === 0) {
        return;
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
