import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AuditLogActionTypes, EmbedOptions, Guild, Routes } from "oceanic.js";

export default new ClientEvent("guildEmojisUpdate", async function guildEmojisUpdateEvent(guild, emojis, oldEmojis) {
    if (oldEmojis === null) {
        return;
    }
    const eventsCreate = await LogEvent.getType(guild.id, LogEvents.EMOJI_CREATE);
    const eventsDelete = await LogEvent.getType(guild.id, LogEvents.EMOJI_DELETE);
    const eventsUpdate = await LogEvent.getType(guild.id, LogEvents.EMOJI_UPDATE);
    if (eventsCreate.length === 0 && eventsDelete.length === 0 && eventsUpdate.length === 0) {
        return;
    }

    const addedEmojis = emojis.filter(e => !oldEmojis.some(oe => oe.id === e.id));
    const removedEmojis = oldEmojis.filter(e => !emojis.some(oe => oe.id === e.id));
    const updatedEmojis = emojis.filter(e => !addedEmojis.some(ae => ae.id === e.id) && JSON.stringify(e) !== JSON.stringify(oldEmojis.find(oe => oe.id === e.id)));

    if (eventsCreate.length !== 0 && addedEmojis.length !== 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const emoji of addedEmojis) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Emoji Created")
                .setColor(Colors.green)
                .addField("Emoji Info", [
                    `Emoji: <${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                    `Name: **${emoji.name}**`,
                    `ID: **${emoji.id}**`,
                    `Animated: **${emoji.animated ? "Yes" : "No"}**`,
                    `Managed: **${emoji.managed ? "Yes" : "No"}**`,
                    `Require Colons: **${emoji.requireColons ? "Yes" : "No"}**`,
                    `Role Requirement: **${emoji.roles.length === 0 ? "No Requirements" : emoji.roles.map(r => `<@&${r}>`).join(", ")}**`
                ].join("\n"), false)
                .setImage(`${Routes.CDN_URL}${Routes.CUSTOM_EMOJI(emoji.id)}`)
                .toJSON()
            );
        }

        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.EMOJI_CREATE,
                limit:      50
            });
            const ids = new Set(addedEmojis.map(e => e.id));
            const entry = auditLog.entries.find(e => e.targetID !== null && ids.has(e.targetID));
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Emoji Created: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) {
                    embed.addField("Reason", entry.reason, false);
                }
                embeds.push(embed.toJSON());
            }
        }

        for (const log of eventsCreate) {
            await log.execute(this, { embeds });
        }
    }

    if (eventsDelete.length !== 0 && removedEmojis.length !== 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const emoji of removedEmojis) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Emoji Deleted")
                .setColor(Colors.red)
                .addField("Emoji Info", [
                    `Emoji: <${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                    `Name: **${emoji.name}**`,
                    `ID: **${emoji.id}**`,
                    `Animated: **${emoji.animated ? "Yes" : "No"}**`,
                    `Managed: **${emoji.managed ? "Yes" : "No"}**`,
                    `Require Colons: **${emoji.requireColons ? "Yes" : "No"}**`,
                    `Role Requirement: **${emoji.roles.length === 0 ? "No Requirements" : emoji.roles.map(r => `<@&${r}>`).join(", ")}**`
                ].join("\n"), false)
                .toJSON()
            );
        }

        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.EMOJI_DELETE,
                limit:      50
            });
            const ids = new Set(removedEmojis.map(e => e.id));
            const entry = auditLog.entries.find(e => e.targetID !== null && ids.has(e.targetID));
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Emoji Deleted: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) {
                    embed.addField("Reason", entry.reason, false);
                }
                embeds.push(embed.toJSON());
            }
        }
        for (const log of eventsDelete) {
            await log.execute(this, { embeds });
        }
    }

    if (eventsUpdate.length !== 0 && updatedEmojis.length !== 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const emoji of removedEmojis) {
            const old = oldEmojis.find(e => e.id === emoji.id)!;
            if (emoji.name !== old.name) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Emoji Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Emoji: <${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                        "This emoji's name was updated."

                    ])
                    .addField("Old Name", old.name, true)
                    .addField("New Name", emoji.name, true)
                    .toJSON()
                );
            }

            const addedRoles = emoji.roles.filter(r => !old.roles.includes(r)).map(r => (guild instanceof Guild && guild.roles.get(r)?.name) || r);
            const removedRoles = old.roles.filter(r => !emoji.roles.includes(r)).map(r => (guild instanceof Guild && guild.roles.get(r)?.name) || r);
            if (addedRoles.length !== 0 || removedRoles.length !== 0) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Emoji Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Emoji: <${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                        "This emoji's role requirements were updated.",
                        "",
                        "```diff",
                        ...addedRoles.map(r => `+ ${r}`),
                        ...removedRoles.map(r => `- ${r}`),
                        "```"
                    ])
                    .toJSON()
                );
            }
        }
        if (embeds.length === 0) {
            return;
        }

        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.EMOJI_UPDATE,
                limit:      50
            });
            const ids = new Set(updatedEmojis.map(e => e.id));
            const entry = auditLog.entries.find(e => e.targetID !== null && ids.has(e.targetID));
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Emoji Updated: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) {
                    embed.addField("Reason", entry.reason, false);
                }
                embeds.push(embed.toJSON());
            }
        }

        for (const log of eventsUpdate) {
            await log.execute(this, { embeds });
        }
    }
});
