import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, EmbedField, EmbedOptions } from "oceanic.js";

export default new ClientEvent("voiceStateUpdate", async function voiceStateUpdateEvent(member, oldState) {
    if (oldState === null || member.voiceState === null) {
        return;
    }
    const events = await LogEvent.getType(member.guildID, LogEvents.VOICE_STATE_UPDATE);
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];

    let deafIndex = -1, muteIndex = -1;
    if (member.voiceState.deaf !== oldState.deaf) {
        deafIndex = embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member was ${member.voiceState.deaf ? "deafened" : "undeafened"}.`
            ])
            .toJSON()
        ) - 1;
    }

    if (member.voiceState.mute !== oldState.mute) {
        muteIndex = embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member was ${member.voiceState.mute ? "muted" : "unmuted"}.`
            ])
            .toJSON()
        ) - 1;
    }

    if (member.voiceState.requestToSpeakTimestamp !== oldState.requestToSpeakTimestamp) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member ${member.voiceState.requestToSpeakTimestamp ? "requested" : "cancelled their request"} to speak.`
            ])
            .toJSON()
        );
    }

    if (member.voiceState.selfDeaf !== oldState.selfDeaf) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member ${member.voiceState.selfDeaf ? "deafened" : "undeafened"} themselves.`
            ])
            .toJSON()
        );
    }

    if (member.voiceState.selfMute !== oldState.selfMute) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member ${member.voiceState.selfMute ? "muted" : "unmuted"} themselves.`
            ])
            .toJSON()
        );
    }

    if (member.voiceState.selfStream !== oldState.selfStream) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member ${member.voiceState.selfStream ? "started" : "stopped"} streaming.`
            ])
            .toJSON()
        );
    }

    if (member.voiceState.selfVideo !== oldState.selfVideo) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member ${member.voiceState.selfVideo ? "started" : "stopped"} sharing their camera.`
            ])
            .toJSON()
        );
    }

    if (member.voiceState.suppress !== oldState.suppress) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Voice State Update")
            .setColor(Colors.green)
            .setDescription([
                `Member: **${member.tag}** (${member.id})`,
                `This member was ${member.voiceState.suppress ? "suppressed" : "unsuppressed"}.`
            ])
            .toJSON()
        );
    }

    if ((deafIndex !== -1 || muteIndex !== -1) && member.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await member.guild.getAuditLog({
            actionType: AuditLogActionTypes.MEMBER_UPDATE,
            limit:      50
        });
        const entryDeaf = auditLog.entries.find(e => e.targetID === member.id && e.changes?.find(c => c.key === "deaf" && c.new_value === member.voiceState?.deaf && c.old_value === oldState.deaf));
        const entryMute = auditLog.entries.find(e => e.targetID === member.id && e.changes?.find(c => c.key === "mute" && c.new_value === member.voiceState?.mute && c.old_value === oldState.mute));

        if (deafIndex !== -1 && entryDeaf?.user && (entryDeaf.createdAt.getTime() + 5e3) > Date.now()) {
            const fields: Array<EmbedField> = [];
            fields.push({
                name:   "Blame",
                value:  `**${entryDeaf.user.tag}** (${entryDeaf.user.mention})`,
                inline: false
            });
            if (entryDeaf.reason) {
                fields.push({
                    name:   "Reason",
                    value:  entryDeaf.reason,
                    inline: false
                });
            }
            embeds[deafIndex].fields!.push(...fields);
        }

        if (muteIndex !== -1 && entryMute?.user && (entryMute.createdAt.getTime() + 5e3) > Date.now()) {
            const fields: Array<EmbedField> = [];
            fields.push({
                name:   "Blame",
                value:  `**${entryMute.user.tag}** (${entryMute.user.mention})`,
                inline: false
            });
            if (entryMute.reason) {
                fields.push({
                    name:   "Reason",
                    value:  entryMute.reason,
                    inline: false
                });
            }
            embeds[deafIndex].fields!.push(...fields);
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
