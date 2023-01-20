import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, Guild, Role } from "oceanic.js";

export default new ClientEvent("guildRoleDelete", async function guildRoleDeleteEvent(role, guild) {
    const events = await LogEvent.getType(guild.id, LogEvents.ROLE_DELETE);

    let managedType: string | undefined;
    if (role instanceof Role) {
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
    }
    const embed = Util.makeEmbed(true)
        .setTitle("Role Deleted")
        .setColor(Colors.red)
        .addField("Role Info", role instanceof Role ? [
            `Name: **${role.name}**`,
            `Color: **${role.color === 0 ? "[NONE]" : `#${role.color.toString(16).padStart(6, "0").toUpperCase()}`}**`,
            `Hoisted: **${role.hoist ? "Yes" : "No"}**`,
            `Managed: **${role.managed ? `Yes - ${managedType || "Unknown"}` : "No"}**`,
            `Mentionable: **${role.mentionable ? "Yes" : "No"}**`,
            `Permissions: [${role.permissions.allow}](https://discordapi.com/permissions.html#${role.permissions.allow})`,
            `Position: **${role.position}**`
        ].join("\n") : `Role ID: \`${role.id}\`\nNo other information is known.`, false);

    if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(guild, AuditLogActionTypes.ROLE_CREATE, e => e.targetID === role.id);
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
