import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { IntegrationExpireBehaviorNames } from "../util/Names.js";
import { AuditLogActionTypes, EmbedOptions, Guild } from "oceanic.js";

export default new ClientEvent("integrationUpdate", async function integrationUpdateEvent(guild, integration, oldIntegration) {
    if (oldIntegration === null) {
        return;
    }
    const events = await LogEvent.getType(guild.id, LogEvents.INTEGRATION_DELETE);
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];
    if (integration.account.id !== oldIntegration.account.id) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's associated account was been updated."
            ])
            .addField("Old Account", `${oldIntegration.account.name} (${oldIntegration.account.id})`, true)
            .addField("New Account", `${integration.account.name} (${integration.account.id})`, true)
            .toJSON()
        );
    }

    if (integration.enableEmoticons !== oldIntegration.enableEmoticons) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                `This integration's emoticons were ${integration.enableEmoticons ? "enabled" : "disabled"}.`
            ])
            .toJSON()
        );
    }

    if (integration.enabled !== oldIntegration.enabled) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                `This integration was ${integration.enabled ? "enabled" : "disabled"}.`
            ])
            .toJSON()
        );
    }

    if (integration.expireBehavior !== oldIntegration.expireBehavior) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's expire behavior was changed."
            ])
            .addField("Old Behavior", oldIntegration.expireBehavior === undefined ? "Unknown" : IntegrationExpireBehaviorNames[oldIntegration.expireBehavior], true)
            .addField("New Behavior", integration.expireBehavior === undefined ? "Unknown" : IntegrationExpireBehaviorNames[integration.expireBehavior], true)
            .toJSON()
        );
    }

    if (integration.expireGracePeriod !== oldIntegration.expireGracePeriod) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's expire grace period was changed."
            ])
            .addField("Old Grace Period", oldIntegration.expireGracePeriod === undefined ? "Unknown" : `${oldIntegration.expireGracePeriod} Days`, true)
            .addField("New Grace Period", integration.expireGracePeriod === undefined ? "Unknown" : `${integration.expireGracePeriod} Days`, true)
            .toJSON()
        );
    }

    if (integration.name !== oldIntegration.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's name was changed."
            ])
            .addField("Old Name", oldIntegration.name, true)
            .addField("New Name", integration.name, true)
            .toJSON()
        );
    }

    if (integration.revoked !== oldIntegration.revoked) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                `This integration was ${integration.revoked ? "revoked" : "unrevoked"}.`
            ])
            .toJSON()
        );
    }

    if (integration.roleID !== oldIntegration.roleID) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's role was changed."
            ])
            .addField("Old Role", oldIntegration.roleID === null ? "None" : `<@&${oldIntegration.roleID}>`, true)
            .addField("New Role", integration.roleID === null ? "None" : `<@&${integration.roleID}>`, true)
            .toJSON()
        );
    }

    if (integration.user?.id !== oldIntegration.user?.id) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Integration Updated")
            .setColor(Colors.gold)
            .setDescription([
                `**Integration:** ${integration.name} (${integration.id})`,
                "This integration's user was changed."
            ])
            .addField("Old User", oldIntegration.user === undefined ? "None" : `<@${oldIntegration.user.id}>`, true)
            .addField("New User", integration.user === undefined ? "None" : `<@${integration.user.id}>`, true)
            .toJSON()
        );
    }

    if (embeds.length === 0) {
        return;
    }

    if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const auditLog = await guild.getAuditLog({
            actionType: AuditLogActionTypes.INTEGRATION_UPDATE,
            limit:      50
        });
        const entry = auditLog.entries.find(e => e.targetID === integration.id);
        if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
            const embed = Util.makeEmbed(true)
                .setTitle("Integration Update: Blame")
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
