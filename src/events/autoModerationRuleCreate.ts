import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AutoModerationActionTypeDescriptions, AutoModerationEventTypeNames, AutoModerationKeywordPresetTypeNames, AutoModerationTriggerTypeNames } from "../util/Names.js";
import Config from "../config/index.js";
import { AuditLogActionTypes, AutoModerationTriggerTypes } from "oceanic.js";

export default new ClientEvent("autoModerationRuleCreate", async function autoModerationRuleCreateEvent(rule) {
    const events = await LogEvent.getType(rule.guildID, LogEvents.AUTOMOD_RULE_CREATE);
    if (events.length === 0) {
        return;
    }

    const actions = rule.actions.map(action => AutoModerationActionTypeDescriptions[action.type](action));

    const trigger = [`${AutoModerationTriggerTypeNames[rule.triggerType]}}`];
    switch (rule.triggerType) {
        case AutoModerationTriggerTypes.KEYWORD: {
            trigger.push(...rule.triggerMetadata.keywordFilter!.map(k => `${Config.emojis.default.dot} ${k}`));
            break;
        }

        case AutoModerationTriggerTypes.KEYWORD_PRESET: {
            trigger.push("```diff");
            if (rule.triggerMetadata.presets) {
                trigger.push(...rule.triggerMetadata.presets.map(p => `- ${AutoModerationKeywordPresetTypeNames[p]}`));
            }
            if (rule.triggerMetadata.allowList) {
                trigger.push(...rule.triggerMetadata.allowList.map(k => `+ ${k}`));
            }
            if (trigger.length === 2) {
                trigger.push("No Config");
            }
            trigger.push("```");
            break;
        }

        case AutoModerationTriggerTypes.MENTION_SPAM: {
            trigger.push(`Threshold: ${rule.triggerMetadata.mentionTotalLimit!}`);
            break;
        }
    }

    const creator = (await this.getUser(rule.creatorID))!;
    const embed = Util.makeEmbed(true)
        .setTitle("Auto Moderation Rule Created")
        .setColor(Colors.green)
        .addField("Rule Info", [
            `Name: **${rule.name}**`,
            `Enabled: **${rule.enabled ? "Yes" : "No"}**`,
            `Creator: **${creator.tag}** (${creator.mention})`,
            `Event Type: **${AutoModerationEventTypeNames[rule.eventType]}**`,
            `Exempt Channels: ${rule.exemptChannels.length === 0 ? "None" : rule.exemptChannels.map(c => `<#${c}>`).join(", ")}`,
            `Exempt Roles: ${rule.exemptRoles.length === 0 ? "None" : rule.exemptRoles.map(r => `<@&${r}>`).join(", ")}`,
            "Trigger:",
            ...trigger,
            "Actions:",
            ...actions
        ].join("\n"), false);

    if (rule.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(rule.guild, AuditLogActionTypes.AUTO_MODERATION_RULE_CREATE, e => e.targetID === rule.id);
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
