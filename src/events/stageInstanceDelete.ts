import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { StageInstancePrivacyLevelNames } from "../util/Names.js";
import { AuditLogActionTypes } from "oceanic.js";

export default new ClientEvent("stageInstanceDelete", async function stageInstanceDeleteEvent(stage) {
    const events = await LogEvent.getType(stage.guildID, LogEvents.STAGE_INSTANCE_DELETE);
    if (events.length === 0) return;

    const embed = Util.makeEmbed(true)
        .setTitle("Stage Instance Deleted")
        .setColor(Colors.red)
        .addField("Stage Instance Info", [
            `Channel: <#${stage.channelID}>`,
            `Privacy Level: ${StageInstancePrivacyLevelNames[stage.privacyLevel]}`,
            `Scheduled Event: ${stage.scheduledEventID === null ? "None" : stage.scheduledEvent === undefined ? `Unknown Name (${stage.scheduledEventID})` : `**${stage.scheduledEvent.name}** (${stage.scheduledEventID})`}`,
            `Topic: ${stage.topic ?? "None"}`
        ].join("\n"), false);

    if (stage.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await stage.guild.getAuditLog({
            actionType: AuditLogActionTypes.STAGE_INSTANCE_DELETE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === stage.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.tag})`, false);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
