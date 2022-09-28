import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AutoModerationActionTypeNames, AutoModerationEventTypeNames, AutoModerationKeywordPresetTypeNames, AutoModerationTriggerTypeNames } from "../util/Names.js";
import Config from "../config/index.js";
import { AuditLogActionTypes, AutoModerationActionTypes, AutoModerationTriggerTypes } from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("autoModerationRuleDelete", async function autoModerationRuleDeleteEvent(rule) {
    const events = await LogEvent.getType(rule.guildID, LogEvents.AUTOMOD_RULE_DELETE);
    if (events.length === 0) return;

    const actions: Array<string> = [];
    for (const action of rule.actions) {
        switch (action.type) {
            case AutoModerationActionTypes.BLOCK_MESSAGE: actions.push(`${Config.emojis.default.dot} ${AutoModerationActionTypeNames[action.type]}`); break;
            case AutoModerationActionTypes.SEND_ALERT_MESSAGE: actions.push(`${Config.emojis.default.dot} ${AutoModerationActionTypeNames[action.type]} - <#${action.metadata.channelID}>`); break;
            case AutoModerationActionTypes.TIMEOUT: actions.push(`${Config.emojis.default.dot} ${AutoModerationActionTypeNames[action.type]} - ${Time.ms(action.metadata.durationSeconds * 1000, { words: true })}`); break;
        }
    }

    const trigger = [`${AutoModerationTriggerTypeNames[rule.triggerType]}}`];
    switch (rule.triggerType) {
        case AutoModerationTriggerTypes.KEYWORD: {
            trigger.push(...rule.triggerMetadata.keywordFilter!.map(k => `${Config.emojis.default.dot} ${k}`));
            break;
        }

        case AutoModerationTriggerTypes.KEYWORD_PRESET: {
            trigger.push("```diff");
            if (rule.triggerMetadata.presets) trigger.push(...rule.triggerMetadata.presets.map(p => `- ${AutoModerationKeywordPresetTypeNames[p]}`));
            if (rule.triggerMetadata.allowList) trigger.push(...rule.triggerMetadata.allowList.map(k => `+ ${k}`));
            if (trigger.length === 2) trigger.push("No Config");
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
        .setTitle("Auto Moderation Rule De;eted")
        .setColor(Colors.red)
        .addField("Rule Info", [
            `Name: **${rule.name}**`,
            `Enabled: **${rule.enabled ? "Yes" : "No"}**`,
            `Creator: **${creator.tag}** (${creator.mention})`,
            `Event Type: **${AutoModerationEventTypeNames[rule.eventType]}**`,
            `Exempt Channels: ${rule.exemptChannels.length ? rule.exemptChannels.map(c => `<#${c}>`).join(", ") : "None"}`,
            `Exempt Roles: ${rule.exemptRoles.length ? rule.exemptRoles.map(r => `<@&${r}>`).join(", ") : "None"}`,
            "Trigger:",
            ...trigger,
            "Actions:",
            ...actions
        ].join("\n"), false);

    if (rule.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await rule.guild.getAuditLog({
            actionType: AuditLogActionTypes.AUTO_MODERATION_RULE_DELETE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === rule.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            embed.addField("Blame", `**${entry.user.tag}** (${entry.user.tag})`, false);
            if (entry.reason) embed.addField("Reason", entry.reason, false);
        }
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});