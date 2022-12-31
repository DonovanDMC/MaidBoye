import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { GuildScheduledEventEntityTypeNames, GuildScheduledEventPrivacyLevelNames, GuildScheduledEventStatusNames } from "../util/Names.js";
import { AuditLogActionTypes, type EmbedOptions } from "oceanic.js";

export default new ClientEvent("guildScheduledEventUpdate", async function guildScheduledEventUpdateEvent(event, oldEvent) {
    if (oldEvent === null) {
        return;
    }
    const events = await LogEvent.getType(event.guildID, LogEvents.SCHEDULED_EVENT_UPDATE);
    if (events.length === 0) {
        return;
    }
    const embeds: Array<EmbedOptions> = [];

    if (event.channelID !== oldEvent.channelID) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's channel was updated."
            ])
            .addField("Old Channel", oldEvent.channelID === null ? "None" : `<#${oldEvent.channelID}>`, false)
            .addField("New Channel", event.channelID === null ? "None" : `<#${event.channelID}>`, false)
            .toJSON()
        );
    }

    if (event.description !== oldEvent.description) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's description was updated."
            ])
            .addField("Old Description", oldEvent.description ?? "None", false)
            .addField("New Description", event.description ?? "None", false)
            .toJSON()
        );
    }

    if (event.entityMetadata?.location !== oldEvent.entityMetadata?.location) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's location was updated."
            ])
            .addField("Old Location", oldEvent.entityMetadata?.location ?? "None", false)
            .addField("New Location", event.entityMetadata?.location ?? "None", false)
            .toJSON()
        );
    }

    if (event.entityType !== oldEvent.entityType) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's entity type was updated."
            ])
            .addField("Old Entity Type", GuildScheduledEventEntityTypeNames[oldEvent.entityType], false)
            .addField("New Entity Type", GuildScheduledEventEntityTypeNames[event.entityType], false)
            .toJSON()
        );
    }

    if (event.image !== oldEvent.image) {
        const embed = Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                `This event's cover image was ${event.image === null ? "removed" : "changed"}.`
            ]);
        if (event.image) {
            embed.setImage(event.imageURL()!);
        }
        embeds.push(embed.toJSON());
    }

    if (event.name !== oldEvent.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's name was updated."
            ])
            .addField("Old Name", oldEvent.name, false)
            .addField("New Name", event.name, false)
            .toJSON()
        );
    }

    if (event.privacyLevel !== oldEvent.privacyLevel) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's privacy level was updated."
            ])
            .addField("Old Privacy Level", GuildScheduledEventPrivacyLevelNames[oldEvent.privacyLevel], false)
            .addField("New Privacy Level", GuildScheduledEventPrivacyLevelNames[event.privacyLevel], false)
            .toJSON()
        );
    }

    if (event.scheduledEndTime?.getTime() ?? null !== oldEvent.scheduledEndTime) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's end time was updated."
            ])
            .addField("Old End Time", oldEvent.scheduledEndTime === null ? "None" : Util.formatDiscordTime(oldEvent.scheduledEndTime, "short-datetime", true), false)
            .addField("New End Time", event.scheduledEndTime === null ? "None" : Util.formatDiscordTime(event.scheduledEndTime, "short-datetime", true), false)
            .toJSON()
        );
    }

    if (event.scheduledStartTime.getTime() !== oldEvent.scheduledStartTime) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's start time was updated."
            ])
            .addField("Old Start Time", oldEvent.scheduledStartTime === null ? "None" : Util.formatDiscordTime(oldEvent.scheduledStartTime, "short-datetime", true), false)
            .addField("New Start Time", event.scheduledStartTime === null ? "None" : Util.formatDiscordTime(event.scheduledStartTime, "short-datetime", true), false)
            .toJSON()
        );
    }

    if (event.status !== oldEvent.status) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Scheduled Event Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Event: **${event.name}** (${event.id})`,
                "This event's status was updated."
            ])
            .addField("Old Status", GuildScheduledEventStatusNames[oldEvent.status], false)
            .addField("New Status", GuildScheduledEventStatusNames[event.status], false)
            .toJSON()
        );
    }

    if (event.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await event.guild.getAuditLog({
            actionType: AuditLogActionTypes.GUILD_SCHEDULED_EVENT_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === event.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Scheduled Event Update: Blame")
                .setColor(Colors.gold)
                .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
            embeds.push(embed.toJSON());
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
