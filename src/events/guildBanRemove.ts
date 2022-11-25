import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, Guild } from "oceanic.js";

export default new ClientEvent("guildBanRemove", async function guildBanRemoveEvent(guild, user) {
    const events = await LogEvent.getType(guild.id, LogEvents.BAN_REMOVE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Member Unbanned")
        .setColor(Colors.green)
        .addField("Member", `**${user.tag}** (${user.mention})`, false);

    if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await guild.getAuditLog({
            actionType: AuditLogActionTypes.MEMBER_BAN_REMOVE,
            limit:      50
        });
        const entry = auditLog.entries[0];
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.mention})`, false);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
