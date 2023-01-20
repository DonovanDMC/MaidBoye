import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { GuildScheduledEventEntityTypeNames, GuildScheduledEventPrivacyLevelNames, GuildScheduledEventStatusNames } from "../util/Names.js";
import { AuditLogActionTypes } from "oceanic.js";

export default new ClientEvent("guildScheduledEventCreate", async function guildScheduledEventCreateEvent(event) {
    const events = await LogEvent.getType(event.guildID, LogEvents.SCHEDULED_EVENT_CREATE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Scheduled Event Created")
        .setColor(Colors.green)
        .addField("Event Info", [
            `Name: **${event.name}**`,
            `Channel: **${event.channelID ?? "N/A"}**`,
            `Description: **${event.description ?? "None"}**`,
            `Location: **${event.entityMetadata?.location ?? "None"}**`,
            `Entity Type: **${GuildScheduledEventEntityTypeNames[event.entityType]}**`,
            `Privacy Level: **${GuildScheduledEventPrivacyLevelNames[event.privacyLevel]}**`,
            `Scheduled Start Time: **${Util.formatDiscordTime(event.scheduledStartTime, "short-datetime", true)}**`,
            `Scheduled End Time: **${event.scheduledEndTime === null ? "None" : Util.formatDiscordTime(event.scheduledEndTime, "short-datetime", true)}**`,
            `Status: **${GuildScheduledEventStatusNames[event.status]}**`
        ].join("\n"), false);
    if (event.image) {
        embed.setImage(event.imageURL()!);
    }

    if (event.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(event.guild, AuditLogActionTypes.GUILD_SCHEDULED_EVENT_CREATE, e => e.targetID === event.id);
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
