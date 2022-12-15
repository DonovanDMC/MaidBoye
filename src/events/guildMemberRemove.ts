import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { UserFlagNames } from "../util/Names.js";
import Config from "../config/index.js";
import { AuditLogActionTypes, Guild, Member, UserFlags } from "oceanic.js";

export default new ClientEvent("guildMemberRemove", async function guildMemberRemoveEvent(user, guild) {
    const member: Member | null = user instanceof Member ? user : null;
    if (user instanceof Member) {
        user = user.user;
    }
    const flags = Util.getFlagsArray(UserFlags, user.publicFlags);
    const content  = [
        `User: **${user.tag}** (${user.mention})`,
        ...(member?.nick ? [`Nickname: **${member.nick}**`] : []),
        ...(member && member.roles.length !== 0 ? member.roles.map(r => `<@&${r}>`).join(" ") : []),
        `Created At: ${Util.formatDiscordTime(user.createdAt, "short-datetime", true)}`,
        ...(member?.joinedAt ? [`Joined At: ${Util.formatDiscordTime(member.joinedAt, "short-datetime", true)}`] : []),
        `Pending: **${member?.pending ? "Yes" : "No"}**`,
        ...(flags.length === 0 ? [] : [
            "",
            "**Badges**:",
            ...flags.map(f => `${Config.emojis.default.dot} ${UserFlagNames[UserFlags[f]]}`),
            ...(member?.id === "242843345402069002" ? [`${Config.emojis.default.dot} ${Config.emojis.custom.don} MaidBoye Developer`] : [])
        ])].join("\n");
    const eventsRemove = await LogEvent.getType(guild.id, LogEvents.MEMBER_REMOVE);
    if (eventsRemove.length !== 0 && eventsRemove.length !== 0) {
        const embed = Util.makeEmbed(true)
            .setTitle("Member Remove")
            .setColor(Colors.red)
            .addField("Member Info", content, false);

        for (const log of eventsRemove) {
            await log.execute(this, { embeds: embed.toJSON(true) });
        }
    }

    const eventsKick = await LogEvent.getType(guild.id, LogEvents.MEMBER_KICK);
    if (eventsKick.length !== 0) {
        const embed = Util.makeEmbed(true)
            .setTitle("Member Kicked")
            .setColor(Colors.orange)
            .addField("Member Info", content, false);

        let ok = false;
        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.MEMBER_KICK,
                limit:      50
            });
            const entry = auditLog.entries.find(e => e.targetID === user.id);
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                embed.addField("Blame", `${entry.user.tag} (${entry.user.id})`, false);
                if (entry.reason) {
                    embed.addField("Reason", entry.reason, false);
                }
                ok = true;
            }
        }

        if (!ok) {
            return;
        }

        for (const log of eventsKick) {
            await log.execute(this, { embeds: embed.toJSON(true) });
        }
    }
});
