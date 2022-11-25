import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { SortOrderTypeNames, VideoQualityModeNames } from "../util/Names.js";
import { AuditLogActionTypes, ChannelTypes, EmbedOptions } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("channelUpdate", async function channelUpdateEvent(channel, oldChannel) {
    if (oldChannel === null) {
        return;
    }
    const events = await LogEvent.getType(channel.guildID, LogEvents.CHANNEL_UPDATE);
    if (events.length === 0) {
        return;
    }


    const embeds: Array<EmbedOptions> = [];
    if (channel.type === ChannelTypes.GUILD_TEXT && oldChannel.type === ChannelTypes.GUILD_ANNOUNCEMENT) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel was converted into an announcement channel."
            ])
            .toJSON()
        );
    }

    if (channel.type === ChannelTypes.GUILD_ANNOUNCEMENT && oldChannel.type === ChannelTypes.GUILD_TEXT) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel was converted into a text channel."
            ])
            .toJSON()
        );
    }

    if ("rateLimitPerUser" in channel && "rateLimitPerUser" in oldChannel && channel.rateLimitPerUser !== oldChannel.rateLimitPerUser) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's Slow Mode was updated."
            ])
            .addField("Old SlowMode", Time.ms((oldChannel.rateLimitPerUser ?? 0) * 1000, { words: true }), false)
            .addField("New SlowMode", Time.ms((channel.rateLimitPerUser ?? 0) * 1000, { words: true }), false)
            .toJSON()
        );
    }

    const newTopic = ("topic" in channel && channel.topic) || "";
    const oldTopic = ("topic" in oldChannel && oldChannel.topic) || "";
    if (newTopic !== oldTopic) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's topic was updated."
            ])
            .addField("Old Topic", oldTopic, false)
            .addField("New Topic", newTopic, false)
            .toJSON()
        );
    }

    if ("bitrate" in channel && "bitrate" in oldChannel && channel.bitrate !== oldChannel.bitrate) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's bitrate was updated."
            ])
            .addField("Old Bitrate", `${oldChannel.bitrate}kbps`, false)
            .addField("New Bitrate", `${channel.bitrate}kbps`, false)
            .toJSON()
        );
    }

    if ("nsfw" in channel && "nsfw" in oldChannel && channel.nsfw !== oldChannel.nsfw) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's NSFW status was updated."
            ])
            .addField("Old Value", oldChannel.nsfw ? "Yes" : "No", false)
            .addField("New Value", channel.nsfw ? "Yes" : "No", false)
            .toJSON()
        );
    }

    if ("rtcRegion" in channel && "rtcRegion" in oldChannel && channel.rtcRegion !== oldChannel.rtcRegion) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's voice region was updated."
            ])
            .addField("Old Region", oldChannel.rtcRegion ?? "Default", false)
            .addField("New Region", channel.rtcRegion ?? "Default", false)
            .toJSON()
        );
    }

    if ("userLimit" in channel && "userLimit" in oldChannel && channel.userLimit !== oldChannel.userLimit) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's user limit was updated."
            ])
            .addField("Old Limit", oldChannel.userLimit === 0 ? "Unlimited" : oldChannel.userLimit.toString(), false)
            .addField("New Limit", channel.userLimit === 0 ? "Unlimited" : channel.userLimit.toString(), false)
            .toJSON()
        );
    }

    let overwriteUpdate = false;
    if ("permissionOverwrites" in channel && "permissionOverwrites" in oldChannel && JSON.stringify(channel.permissionOverwrites.map(o => o.toJSON())) !== JSON.stringify(oldChannel.permissionOverwrites)) {
        overwriteUpdate = true;
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's permissions were updated."
            ])
            .toJSON()
        );
    }

    if (channel.parentID !== oldChannel.parentID) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's category was updated."
            ])
            .addField("Old Category", oldChannel.parentID ? `<#${oldChannel.parentID}>` : "None", false)
            .addField("New Category", channel.parentID ? `<#${channel.parentID}>` : "None", false)
            .toJSON()
        );
    }

    if ("videoQualityMode" in channel && "videoQualityMode" in oldChannel && channel.videoQualityMode !== oldChannel.videoQualityMode) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's video quality mode was updated."
            ])
            .addField("Old Mode", VideoQualityModeNames[oldChannel.videoQualityMode], false)
            .addField("New Mode", VideoQualityModeNames[channel.videoQualityMode], false)
            .toJSON()
        );
    }

    if ("defaultAutoArchiveDuration" in channel && "defaultAutoArchiveDuration" in oldChannel && channel.defaultAutoArchiveDuration !== oldChannel.defaultAutoArchiveDuration) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's default auto archive duration was updated."
            ])
            .addField("Old Duration", Time.ms(oldChannel.defaultAutoArchiveDuration * 1000, { words: true }), false)
            .addField("New Duration", Time.ms(channel.defaultAutoArchiveDuration * 1000, { words: true }), false)
            .toJSON()
        );
    }

    if ("availableTags" in channel && "availableTags" in oldChannel && channel.availableTags !== oldChannel.availableTags) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's available tags were updated."
            ])
            .toJSON()
        );
    }

    if ("defaultReactionEmoji" in channel && "defaultReactionEmoji" in oldChannel && channel.defaultReactionEmoji !== oldChannel.defaultReactionEmoji) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's default reaction emoji was updated."
            ])
            .addField("Old Emoji", oldChannel.defaultReactionEmoji === null ? "[NONE]" : `${oldChannel.defaultReactionEmoji.id === null ? oldChannel.defaultReactionEmoji.name! : `<:forum_emoji:${oldChannel.defaultReactionEmoji.id}>`}`, false)
            .addField("New Emoji", channel.defaultReactionEmoji === null ? "[NONE]" : `${channel.defaultReactionEmoji.id === null ? channel.defaultReactionEmoji.name! : `<:forum_emoji:${channel.defaultReactionEmoji.id}>`}`, false)
            .toJSON()
        );
    }

    if ("defaultSortOrder" in channel && "defaultSortOrder" in oldChannel && channel.defaultSortOrder !== oldChannel.defaultSortOrder) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's default sort order was updated."
            ])
            .addField("Old Order", oldChannel.defaultSortOrder === null ? "Default" : SortOrderTypeNames[oldChannel.defaultSortOrder], false)
            .addField("New Order", channel.defaultSortOrder === null ? "Default" : SortOrderTypeNames[channel.defaultSortOrder], false)
            .toJSON()
        );
    }

    if ("defaultThreadRateLimitPerUser" in channel && "defaultThreadRateLimitPerUser" in oldChannel && channel.defaultThreadRateLimitPerUser !== oldChannel.defaultThreadRateLimitPerUser) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's default thread rate limit was updated."
            ])
            .addField("Old Rate Limit", oldChannel.defaultThreadRateLimitPerUser === 0 ? "Unlimited" : Time.ms(oldChannel.defaultThreadRateLimitPerUser * 1000, { words: true }), false)
            .addField("New Rate Limit", channel.defaultThreadRateLimitPerUser === 0 ? "Unlimited" : Time.ms(channel.defaultThreadRateLimitPerUser * 1000, { words: true }), false)
            .toJSON()
        );
    }

    if (channel.name !== oldChannel.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Channel Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Channel: <#${channel.id}>`,
                "This channel's name was updated."
            ])
            .addField("Old Name", oldChannel.name, false)
            .addField("New Name", channel.name, false)
            .toJSON()
        );
    }

    if (embeds.length === 0) {
        return;
    }

    if (channel.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await channel.guild.getAuditLog({
            actionType: AuditLogActionTypes.CHANNEL_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === channel.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Channel Update: Blame")
                .setColor(Colors.gold)
                .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
            embeds.push(embed.toJSON());
        }

        if (overwriteUpdate) {
            // overwrite create
            const auditLogCreate = await channel.guild.getAuditLog({
                actionType: AuditLogActionTypes.CHANNEL_OVERWRITE_CREATE,
                limit:      50
            });
            const entryCreate = auditLogCreate.entries.find(e => e.targetID === channel.id);
            if (entryCreate?.user && (entryCreate.createdAt.getTime() + 5e3) > Date.now()) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Permission Overwrite Create: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`${entryCreate.user.mention} (${entryCreate.user.id})`)
                    .toJSON()
                );
            }

            // overwrite delete
            const auditLogDelete = await channel.guild.getAuditLog({
                actionType: AuditLogActionTypes.CHANNEL_OVERWRITE_DELETE,
                limit:      50
            });
            const entryDelete = auditLogDelete.entries.find(e => e.targetID === channel.id);
            if (entryDelete?.user && (entryDelete.createdAt.getTime() + 5e3) > Date.now()) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Permission Overwrite Delete: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`${entryDelete.user.mention} (${entryDelete.user.id})`)
                    .toJSON()
                );
            }

            // overwrite update
            const auditLogUpdate = await channel.guild.getAuditLog({
                actionType: AuditLogActionTypes.CHANNEL_OVERWRITE_UPDATE,
                limit:      50
            });
            const entryUpdate = auditLogUpdate.entries.find(e => e.targetID === channel.id);
            if (entryUpdate?.user && (entryUpdate.createdAt.getTime() + 5e3) > Date.now()) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Permission Overwrite Update: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`${entryUpdate.user.mention} (${entryUpdate.user.id})`)
                    .toJSON()
                );
            }
        }
    }

    for (const log of events) {

        await log.execute(this, { embeds });
    }
});
