import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, EmbedOptions, Role } from "oceanic.js";

export default new ClientEvent("guildMemberUpdate", async function guildMemberUpdateEvent(member, oldMember) {
    if (oldMember === null) {
        return;
    }
    const events = await LogEvent.getType(member.guildID, LogEvents.MEMBER_UPDATE);
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];
    if (member.avatar !== oldMember.avatar) {
        const embed = Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This member changed their server avatar.",
                "",
                `${member.avatar === null ? "[Avatar Removed]" : `[New Avatar](${member.avatarURL()})`} ([global](${member.user.avatarURL()}))`
            ]);
        if (member.avatar !== null) {
            embed.setImage(member.avatarURL());
        }
        embeds.push(embed.toJSON());
    }

    if (member.nick !== oldMember.nick) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This member changed their nickname."
            ])
            .addField("Old Nickname", oldMember.nick ?? "[NONE]", false)
            .addField("New Nickname", member.nick ?? "[NONE]", false)
            .toJSON());
    }

    const removedRoles = [] as Array<Role>;
    const addedRoles = [] as Array<Role>;
    for (const r of oldMember.roles) {
        if (!member.roles.includes(r)) {
            removedRoles.push(member.guild.roles.get(r)!);
        }
    }
    for (const r of member.roles) {
        if (!oldMember.roles.includes(r)) {
            addedRoles.push(member.guild.roles.get(r)!);
        }
    }

    let rolesChanged = false;
    if (removedRoles.length !== 0 || addedRoles.length !== 0) {
        rolesChanged = true;
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This users roles were updated.",
                "",
                "**Changes**:",
                "```diff",
                ...addedRoles.map(r => `+ ${r.name}`),
                ...removedRoles.map(r => `- ${r.name}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (member.communicationDisabledUntil !== oldMember.communicationDisabledUntil) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                ...(member.communicationDisabledUntil === null ? ["This member's timeout was removed."] : ["This member was timed out.", `Expires At: ${Util.formatDiscordTime(member.communicationDisabledUntil, "short-datetime", true)}`])
            ])
            .toJSON());
    }


    if (member.pending === false && oldMember.pending === true) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This member passed the welcome gate."
            ])
            .toJSON());
    }

    if (member.deaf !== oldMember.deaf) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                `This member was ${member.deaf ? "deafened" : "undeafened"}.`
            ])
            .toJSON());
    }

    if (member.mute !== oldMember.mute) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                `This member was ${member.mute ? "muted" : "unmuted"}.`
            ])
            .toJSON());
    }

    if (member.premiumSince !== null && oldMember.premiumSince === null) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This member boosted the server."
            ])
            .toJSON());
    }

    if (member.premiumSince === null && oldMember.premiumSince !== null) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Member Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Member: **${member.tag}** (${member.mention})`,
                "This member stopped boosting the server."
            ])
            .toJSON());
    }

    if (embeds.length === 0) {
        return;
    }

    if (member.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await member.guild.getAuditLog({
            actionType: AuditLogActionTypes.MEMBER_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === member.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Member Update: Blame")
                .setColor(Colors.gold)
                .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
            if (entry.reason) {
                embed.addField("Reason", entry.reason, false);
            }
            embeds.push(embed.toJSON());
        }

        if (rolesChanged) {
            const auditLogRoles = await member.guild.getAuditLog({
                actionType: AuditLogActionTypes.MEMBER_ROLE_UPDATE,
                limit:      50
            });
            const entryRoles = auditLogRoles.entries.find(e => e.targetID === member.id);
            if (entryRoles?.user && (entryRoles.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Member Roles Update: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entryRoles.user.tag}** (${entryRoles.user.mention})`);
                if (entryRoles.reason) {
                    embed.addField("Reason", entryRoles.reason, false);
                }
                embeds.push(embed.toJSON());
            }
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
