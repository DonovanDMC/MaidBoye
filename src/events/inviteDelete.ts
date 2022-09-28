import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { InviteTargetTypeNames } from "../util/Names.js";
import { AuditLogActionTypes, Invite } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("inviteDelete", async function inviteDeleteEvent(invite) {
    if (!invite.guild?.id) return;
    const events = await LogEvent.getType(invite.guild.id, LogEvents.INVITE_DELETE);
    if (events.length === 0) return;

    const embed = Util.makeEmbed(true)
        .setTitle("Invite Deleted")
        .setColor(Colors.red)
        .addField("Invite Info", [
            `Channel: <#${invite instanceof Invite ? invite.channelID! : invite.channel!.id}>`,
            `Code: **${invite.code}**`,
            ...(invite instanceof Invite ? [
                `Inviter: ${invite.inviter ? `**${invite.inviter.tag}** (${invite.inviter.mention})` : "**Unknown**"}`,
                `Expire After: **${invite.maxAge === 0 ? "Never" : Time.ms(invite.maxAge, { words: true })}**`,
                `Max Uses: **${invite.maxUses === 0 ? "Unlimited" : invite.maxUses}**`,
                `Target Application: **${invite.targetApplication ? invite.targetApplication.name : "None"}**`,
                `Target Type: **${invite.targetType ? InviteTargetTypeNames[invite.targetType] : "None"}**`,
                `Target User: ${invite.targetUser ? `**${invite.targetUser.tag}** (${invite.targetUser.mention})` : "**None**"}`,
                `Temporary: **${invite.temporary ? "Yes" : "No"}**`
            ] : [])
        ].join("\n"), false);

    if (invite instanceof Invite && invite.guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await invite.guild.getAuditLog({
            actionType: AuditLogActionTypes.INVITE_DELETE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.changes?.find(c => c.key === "code" && c.new_value === invite.code));
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.tag})`, false);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
