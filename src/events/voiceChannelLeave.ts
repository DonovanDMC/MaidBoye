import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, Channel, type StageChannel, type VoiceChannel } from "oceanic.js";

export default new ClientEvent("voiceChannelLeave", async function voiceChannelLeaveEvent(member, inputChannel) {
    if (inputChannel === null) {
        return;
    }

    if (!(inputChannel instanceof Channel)) {
        inputChannel = await this.rest.channels.get(inputChannel.id);
    }
    const channel = inputChannel as VoiceChannel | StageChannel;
    const events = await LogEvent.getType(channel.guildID, LogEvents.VOICE_LEAVE);
    if (events.length === 0) {
        return;
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Voice Channel Left")
        .setColor(Colors.green)
        .addField("Info", [
            `Channel: **${channel.name}** (${channel.id})`,
            `Member: **${member.tag}** (${member.id})`
        ].join("\n"), false);

    if (channel.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(channel.guild, AuditLogActionTypes.MEMBER_DISCONNECT, e => e.targetID === member.id);
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
