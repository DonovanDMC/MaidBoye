import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AutoModerationActionTypeNames, AutoModerationEventTypeNames, AutoModerationTriggerTypeNames } from "../util/Names.js";
import { AuditLogActionTypes, AutoModerationTriggerTypes, EmbedOptions } from "oceanic.js";

export default new ClientEvent("autoModerationRuleUpdate", async function autoModerationRuleUpdateEvent(rule, oldRule) {
    if (oldRule === null) {
        return;
    }
    const events = await LogEvent.getType(rule.guildID, LogEvents.AUTOMOD_RULE_UPDATE);
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];
    if (JSON.stringify(rule.actions) !== JSON.stringify(oldRule.actions)) {
        const addedActions = rule.actions.filter(a => !oldRule.actions.includes(a)).map(a => AutoModerationActionTypeNames[a.type]);
        const removedActions = oldRule.actions.filter(a => !rule.actions.includes(a)).map(a => AutoModerationActionTypeNames[a.type]);
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's actions were updated.",
                "",
                "```diff",
                ...addedActions.map(a => `+ ${a}`),
                ...removedActions.map(a => `- ${a}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (JSON.stringify(rule.triggerMetadata) !== JSON.stringify(oldRule.triggerMetadata)) {
        if (JSON.stringify(rule.triggerMetadata.allowList ?? []) !== JSON.stringify(oldRule.triggerMetadata.allowList ?? [])) {
            const addedAllowList = oldRule.triggerMetadata.allowList?.filter(a => !rule.triggerMetadata.allowList?.includes(a)) ?? [];
            const removedAllowList = rule.triggerMetadata.allowList?.filter(a => !oldRule.triggerMetadata.allowList?.includes(a)) ?? [];
            embeds.push(Util.makeEmbed(true)
                .setTitle("Auto Moderation Rule Updated")
                .setColor(Colors.gold)
                .setDescription([
                    `Rule: **${rule.name}**`,
                    "This rule's allow list was updated.",
                    "",
                    "```diff",
                    ...addedAllowList.map(a => `+ ${a}`),
                    ...removedAllowList.map(a => `- ${a}`),
                    "```"
                ])
                .toJSON()
            );
        }

        if (JSON.stringify(rule.triggerMetadata.keywordFilter ?? []) !== JSON.stringify(oldRule.triggerMetadata.keywordFilter ?? [])) {
            const addedkeywordFilters = oldRule.triggerMetadata.keywordFilter?.filter(a => !rule.triggerMetadata.keywordFilter?.includes(a)) ?? [];
            const removedKeywordFilters = rule.triggerMetadata.keywordFilter?.filter(a => !oldRule.triggerMetadata.keywordFilter?.includes(a)) ?? [];
            embeds.push(Util.makeEmbed(true)
                .setTitle("Auto Moderation Rule Updated")
                .setColor(Colors.gold)
                .setDescription([
                    `Rule: **${rule.name}**`,
                    "This rule's keyword filter was updated.",
                    "",
                    "```diff",
                    ...addedkeywordFilters.map(f => `+ ${f}`),
                    ...removedKeywordFilters.map(f => `- ${f}`),
                    "```"
                ])
                .toJSON()
            );
        }

        if (rule.triggerMetadata.mentionTotalLimit !== oldRule.triggerMetadata.mentionTotalLimit) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Auto Moderation Rule Updated")
                .setColor(Colors.gold)
                .setDescription([
                    `Rule: **${rule.name}**`,
                    "This rule's mention limit was updated."
                ])
                .addField("Old Mention Limit", oldRule.triggerType === AutoModerationTriggerTypes.MENTION_SPAM ? (oldRule.triggerMetadata.mentionTotalLimit ?? 0).toString() : "N/A", true)
                .addField("New Mention Limit", rule.triggerType === AutoModerationTriggerTypes.MENTION_SPAM ? (rule.triggerMetadata.mentionTotalLimit ?? 0).toString() : "N/A", true)
                .toJSON()
            );
        }

        if (JSON.stringify(rule.triggerMetadata.presets ?? []) !== JSON.stringify(oldRule.triggerMetadata.presets ?? [])) {
            const addedPresets = oldRule.triggerMetadata.presets?.filter(p => !rule.triggerMetadata.presets?.includes(p)) ?? [];
            const removedPresets = rule.triggerMetadata.presets?.filter(p => !oldRule.triggerMetadata.presets?.includes(p)) ?? [];
            embeds.push(Util.makeEmbed(true)
                .setTitle("Auto Moderation Rule Updated")
                .setColor(Colors.gold)
                .setDescription([
                    `Rule: **${rule.name}**`,
                    "This rule's presets were updated.",
                    "",
                    "```diff",
                    ...addedPresets.map(p => `+ ${p}`),
                    ...removedPresets.map(p => `- ${p}`),
                    "```"
                ])
                .toJSON()
            );
        }
    }

    if (rule.triggerType !== oldRule.triggerType) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's trigger type was updated."
            ])
            .addField("Old Trigger Type", AutoModerationTriggerTypeNames[oldRule.triggerType], true)
            .addField("New Trigger Type", AutoModerationTriggerTypeNames[rule.triggerType], true)
            .toJSON()
        );
    }

    if (rule.enabled !== oldRule.enabled) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                `This rule was ${rule.enabled ? "enabled" : "disabled"}.`
            ])
            .toJSON()
        );
    }

    if (rule.eventType !== oldRule.eventType) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's event type was updated."
            ])
            .addField("Old Event Type", AutoModerationEventTypeNames[oldRule.eventType], true)
            .addField("New Event Type", AutoModerationEventTypeNames[rule.eventType], true)
            .toJSON()
        );
    }

    if (JSON.stringify(rule.exemptChannels) !== JSON.stringify(oldRule.exemptChannels)) {
        const addedChannels = oldRule.exemptChannels.filter(c => !rule.exemptChannels.includes(c)).map(ch => rule.guild.channels.get(ch)?.name ?? ch);
        const removedChannels = rule.exemptChannels.filter(c => !oldRule.exemptChannels.includes(c)).map(ch => rule.guild.channels.get(ch)?.name ?? ch);
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's exempt channels were updated.",
                "",
                "```diff",
                ...addedChannels.map(c => `+ ${c}`),
                ...removedChannels.map(c => `- ${c}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (JSON.stringify(rule.exemptRoles) !== JSON.stringify(oldRule.exemptRoles)) {
        const addedRoles = oldRule.exemptRoles.filter(r => !rule.exemptRoles.includes(r)).map(r => rule.guild.roles.get(r)?.name ?? r);
        const removedRoles = rule.exemptRoles.filter(r => !oldRule.exemptRoles.includes(r)).map(r => rule.guild.roles.get(r)?.name ?? r);
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's exempt roles were updated.",
                "",
                "```diff",
                ...addedRoles.map(r => `+ ${r}`),
                ...removedRoles.map(r => `- ${r}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (rule.name !== oldRule.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Auto Moderation Rule Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Rule: **${rule.name}**`,
                "This rule's name was updated."
            ])
            .addField("Old Name", oldRule.name, true)
            .addField("New Name", rule.name, true)
            .toJSON()
        );
    }

    if (embeds.length === 0) {
        return;
    }

    if (rule.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await rule.guild.getAuditLog({
            actionType: AuditLogActionTypes.AUTO_MODERATION_RULE_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === rule.id);
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
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
