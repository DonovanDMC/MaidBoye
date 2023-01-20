import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes } from "oceanic.js";

export default new ClientEvent("guildRoleCreate", async function guildRoleCreateEvent(role) {
    const events = await LogEvent.getType(role.guildID, LogEvents.ROLE_CREATE);
    if (events.length === 0) {
        return;
    }

    let managedType: string | undefined;
    if (role.tags.botID !== undefined) {
        const user = await this.getUser(role.tags.botID);
        managedType = `Bot Permissions (${user?.tag ?? role.tags.botID})`;
    } else if (role.tags.integrationID !== undefined) {
        managedType = `Integration (${role.guild.integrations.get(role.tags.integrationID)?.name ?? role.tags.integrationID})`;
    } else if (role.tags.premiumSubscriber !== false) {
        managedType = "Nitro Booster";
    } else if (role.tags.subscriptionListingID !== undefined) {
        managedType = `Subscription Role (Purchasable: ${role.tags.availableForPurchase ? "Yes" : "No"})`;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Role Created")
        .setColor(Colors.green)
        .addField("Role Info", [
            `Name: **${role.name}**`,
            `Color: **${role.color === 0 ? "[NONE]" : `#${role.color.toString(16).padStart(6, "0").toUpperCase()}`}**`,
            `Hoisted: **${role.hoist ? "Yes" : "No"}**`,
            `Managed: **${role.managed ? `Yes - ${managedType || "Unknown"}` : "No"}**`,
            `Mentionable: **${role.mentionable ? "Yes" : "No"}**`,
            `Permissions: [${role.permissions.allow}](https://discordapi.com/permissions.html#${role.permissions.allow})`,
            `Position: **${role.position}**`
        ].join("\n"), false);

    if (role.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(role.guild, AuditLogActionTypes.ROLE_CREATE, e => e.targetID === role.id);
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
