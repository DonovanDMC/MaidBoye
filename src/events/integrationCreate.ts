import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { IntegrationExpireBehaviorNames } from "../util/Names.js";
import { AuditLogActionTypes, Guild } from "oceanic.js";

export default new ClientEvent("integrationCreate", async function integrationCreateEvent(guild, integration) {
    const events = await LogEvent.getType(guild.id, LogEvents.INTEGRATION_CREATE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Integration Created")
        .setColor(Colors.green)
        .addField("Integration Info", [
            `Account: **${integration.account.name}**`,
            `Enable Emoticons: **${integration.enableEmoticons ? "Yes" : "No"}**`,
            `Enabled: **${integration.enabled ? "Yes" : "No"}**`,
            `Expire Behavior: **${integration.expireBehavior === undefined ? "None" : IntegrationExpireBehaviorNames[integration.expireBehavior]}**`,
            `Expire Grace Period: **${integration.expireGracePeriod === undefined ? "None" : `${integration.expireGracePeriod} Day${integration.expireBehavior === 1 ? "" : "s"}`}**`,
            `Name: **${integration.name}**`,
            `Revoked: **${integration.revoked ? "Yes" : "No"}**`,
            `Role: **${integration.roleID ? `<@&${integration.roleID}>` : "None"}**`,
            `Scopes: **${integration.scopes?.join("**, **") || "None"}**`,
            `Subscriber Count: **${integration.subscriberCount ?? 0}**`,
            `Synced At: **${integration.syncedAt ? Util.formatDiscordTime(integration.syncedAt, "short-datetime", true) : "None"}**`
        ].join("\n"), false);

    if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(guild, AuditLogActionTypes.INTEGRATION_CREATE, e => e.targetID === integration.id);
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
