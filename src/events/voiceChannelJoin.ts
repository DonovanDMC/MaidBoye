import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, Channel, StageChannel, VoiceChannel } from "oceanic.js";

export default new ClientEvent("voiceChannelJoin", async function voiceChannelJoinEvent(member, inputChannel) {
    if (!(inputChannel instanceof Channel)) inputChannel = await this.rest.channels.get(inputChannel.id);
    const channel = inputChannel as VoiceChannel | StageChannel;
    const events = await LogEvent.getType(channel.guildID, LogEvents.VOICE_JOIN);
    if (events.length === 0) return;

    const embed = Util.makeEmbed(true)
        .setTitle("Voice Channel Joined")
        .setColor(Colors.green)
        .addField("Info", [
            `Channel: **${channel.name}** (${channel.id})`,
            `Member: **${member.tag}** (${member.id})`
        ].join("\n"), false);

    if (channel.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await channel.guild.getAuditLog({
            actionType: AuditLogActionTypes.MEMBER_MOVE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.options?.channelID === channel.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            embed.setTitle("Voice Channel Member Moved");
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.tag})`, false);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
