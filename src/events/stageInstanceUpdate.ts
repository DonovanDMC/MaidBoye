import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { StageInstancePrivacyLevelNames } from "../util/Names.js";
import { AuditLogActionTypes, EmbedOptions, GuildScheduledEvent } from "oceanic.js";

export default new ClientEvent("stageInstanceUpdate", async function stageInstanceUpdateEvent(stage, oldStage) {
    if (oldStage === null) return;
    const events = await LogEvent.getType(stage.guildID, LogEvents.STAGE_INSTANCE_UPDATE);
    if (events.length === 0) return;

    const embeds: Array<EmbedOptions> = [];

    if (stage.scheduledEventID !== oldStage.scheduledEventID) {
        let oldEvent: GuildScheduledEvent | undefined;
        embeds.push(Util.makeEmbed(true)
            .setTitle("Stage Instance Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Stage Instance: <#${stage.channelID}>`,
                "This stage instace's scheduled event was updated."
            ])
            .addField("Old Scheduled Event", oldStage.scheduledEventID === null ? "None" : ((oldEvent = stage.guild.scheduledEvents.get(oldStage.scheduledEventID)) === undefined ? `Unknown Name (${oldStage.scheduledEventID})` : `**${oldEvent.name}** (${oldStage.scheduledEventID})`), false)
            .addField("New Scheduled Event", stage.scheduledEventID === null ? "None" : (stage.scheduledEvent === undefined ? `Unknown Name (${stage.scheduledEventID})` : `**${stage.scheduledEvent.name}** (${stage.scheduledEventID})`), false)
            .toJSON()
        );
    }

    if (stage.privacyLevel !== oldStage.privacyLevel) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Stage Instance Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Stage Instance: <#${stage.channelID}>`,
                "This stage instance's privacy level was updated."
            ])
            .addField("Old Privacy Level", StageInstancePrivacyLevelNames[oldStage.privacyLevel], false)
            .addField("New Privacy Level", StageInstancePrivacyLevelNames[stage.privacyLevel], false)
            .toJSON()
        );
    }

    if (stage.topic !== oldStage.topic) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Stage Instance Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Stage Instance: <#${stage.channelID}>`,
                "This stage instance's topic was updated."
            ])
            .addField("Old Topic", oldStage.topic, false)
            .addField("New Topic", stage.topic, false)
            .toJSON()
        );
    }

    if (stage.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await stage.guild.getAuditLog({
            actionType: AuditLogActionTypes.STAGE_INSTANCE_CREATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === stage.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Stage Instance Update: Blame")
                .setColor(Colors.gold)
                .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
            embeds.push(embed.toJSON());
        }
    }

    if (embeds.length === 0) return;

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
