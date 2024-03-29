import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { InviteTargetTypeNames } from "../util/Names.js";
import InviteTracker from "../util/InviteTracker.js";
import { AuditLogActionTypes } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("inviteCreate", async function inviteCreateEvent(invite) {
    if (invite.guildID === null) {
        return;
    }

    await InviteTracker.trackCreate(invite.guildID, invite.code);
    const events = await LogEvent.getType(invite.guildID, LogEvents.INVITE_CREATE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Invite Created")
        .setColor(Colors.green)
        .addField("Invite Info", [
            `Channel: <#${invite.channelID!}>`,
            `Code: **${invite.code}**`,
            `Inviter: ${invite.inviter ? `**${invite.inviter.tag}** (${invite.inviter.mention})` : "**Unknown**"}`,
            `Expire After: **${invite.maxAge === 0 ? "Never" : Time.ms(invite.maxAge, { words: true })}**`,
            `Max Uses: **${invite.maxUses === 0 ? "Unlimited" : invite.maxUses}**`,
            `Target Application: **${invite.targetApplication ? invite.targetApplication.name : "None"}**`,
            `Target Type: **${invite.targetType ? InviteTargetTypeNames[invite.targetType] : "None"}**`,
            `Target User: ${invite.targetUser ? `**${invite.targetUser.tag}** (${invite.targetUser.mention})` : "**None**"}`,
            `Temporary: **${invite.temporary ? "Yes" : "No"}**`
        ].join("\n"), false);

    const guild = invite.guild?.completeGuild;
    if (guild?.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(guild, AuditLogActionTypes.INVITE_CREATE, e => !!e.changes?.find(c => c.key === "code" && c.new_value === invite.code));
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
