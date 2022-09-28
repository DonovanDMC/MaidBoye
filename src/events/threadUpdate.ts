import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, ChannelFlags, ChannelTypes, EmbedOptions } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("threadUpdate", async function threadUpdateEvent(thread, oldThread) {
    if (oldThread === null) return;
    const events = await LogEvent.getType(thread.guildID, LogEvents.THREAD_UPDATE);
    if (events.length === 0) return;

    const embeds: Array<EmbedOptions> = [];

    const oldFlags = Util.getFlagsArray(ChannelFlags, oldThread.flags);
    const newFlags = Util.getFlagsArray(ChannelFlags, thread.flags);
    const addedFlags = newFlags.filter(flag => !oldFlags.includes(flag));
    const removedFlags = oldFlags.filter(flag => !newFlags.includes(flag));
    if (addedFlags.length > 0 || removedFlags.length > 0) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                "This thread's flags were updated.",
                "",
                "```diff",
                ...addedFlags.map(flag => `+ ${flag}`),
                ...removedFlags.map(flag => `- ${flag}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (thread.name !== oldThread.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                "This thread's name was updated."
            ])
            .addField("Old Name", oldThread.name, true)
            .addField("New Name", thread.name, true)
            .toJSON()
        );
    }

    if (thread.rateLimitPerUser !== oldThread.rateLimitPerUser) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                "This thread's slowmode was updated."
            ])
            .addField("Old Slowmode", oldThread.rateLimitPerUser === 0 ? "None" : `${Time.ms(oldThread.rateLimitPerUser * 1000, { words: true })}`, true)
            .addField("New Slowmode", thread.rateLimitPerUser === 0 ? "None" : `${Time.ms(thread.rateLimitPerUser * 1000, { words: true })}`, true)
            .toJSON()
        );
    }

    if (thread.threadMetadata.archived !== oldThread.threadMetadata.archived) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                `This thread was ${thread.threadMetadata.archived ? "archived" : "unarchived"}.`
            ])
            .toJSON()
        );
    }

    if (thread.threadMetadata.locked !== oldThread.threadMetadata.locked) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                `This thread was ${thread.threadMetadata.locked ? "locked" : "unlocked"}.`
            ])
            .toJSON()
        );
    }

    if (thread.type === ChannelTypes.PRIVATE_THREAD && oldThread.type === ChannelTypes.PRIVATE_THREAD && thread.threadMetadata.invitable !== oldThread.threadMetadata.invitable) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Thread Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Thread:** ${thread.name} (${thread.id})`,
                `This thread was made ${thread.threadMetadata.invitable ? "invitable" : "uninvitable"}.`
            ])
            .toJSON()
        );
    }

    if (thread.guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await thread.guild.getAuditLog({
            actionType: AuditLogActionTypes.THREAD_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === thread.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Thread Update: Blame")
                .setColor(Colors.gold)
                .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
            embeds.push(embed.toJSON());
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
