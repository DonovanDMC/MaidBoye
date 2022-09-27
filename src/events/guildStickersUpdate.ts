import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { StickerFormatTypeNames, StickerTypeNames } from "../util/Names.js";
import { AuditLogActionTypes, EmbedOptions, Guild, Routes } from "oceanic.js";

export default new ClientEvent("guildStickersUpdate", async function guildStickersUpdateEvent(guild, stickers, oldStickers) {
    if (oldStickers === null) return;
    const eventsCreate = await LogEvent.getType(guild.id, LogEvents.STICKER_CREATE);
    const eventsDelete = await LogEvent.getType(guild.id, LogEvents.STICKER_DELETE);
    const eventsUpdate = await LogEvent.getType(guild.id, LogEvents.STICKER_DELETE);
    if (eventsCreate.length === 0 && eventsDelete.length === 0 && eventsUpdate.length === 0) return;

    const addedStickers = stickers.filter(s => !oldStickers.find(os => os.id === s.id));
    const removedStickers = oldStickers.filter(s => !stickers.find(os => os.id === s.id));
    const updatedStickers = stickers.filter(s => !addedStickers.find(os => os.id === s.id) && JSON.stringify(s) !== JSON.stringify(oldStickers.find(os => os.id === s.id)));

    if (eventsCreate.length > 0 && addedStickers.length > 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const sticker of addedStickers) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Sticker Created")
                .setColor(Colors.green)
                .addField("Sticker Info", [
                    `Name: **${sticker.name}**`,
                    `ID: **${sticker.id}**`,
                    `Description: **${sticker.description ?? "None"}**`,
                    `Format Type: **${StickerFormatTypeNames[sticker.formatType]}**`,
                    `Sort Value: **${sticker.sortValue ?? "None"}**`,
                    `Tags: **${sticker.tags}**`,
                    `Type: **${StickerTypeNames[sticker.type]}**`
                ].join("\n"), false)
                .setImage(`${Routes.CDN_URL}${Routes.STICKER(sticker.id)}`)
                .toJSON()
            );
        }

        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.STICKER_CREATE,
                limit:      50
            });
            const ids = addedStickers.map(s => s.id);
            const entry = auditLog.entries.find(e => e.targetID !== null && ids.includes(e.targetID));
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Sticker Created: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) embed.addField("Reason", entry.reason, false);
                embeds.push(embed.toJSON());
            }
        }

        for (const log of eventsCreate) {
            await log.execute(this, { embeds });
        }
    }

    if (eventsDelete.length > 0 && removedStickers.length > 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const sticker of removedStickers) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Sticker Deleted")
                .setColor(Colors.red)
                .addField("Sticker Info", [
                    `Name: **${sticker.name}**`,
                    `ID: **${sticker.id}**`,
                    `Description: **${sticker.description ?? "None"}**`,
                    `Format Type: **${StickerFormatTypeNames[sticker.formatType]}**`,
                    `Sort Value: **${sticker.sortValue ?? "None"}**`,
                    `Tags: **${sticker.tags}**`,
                    `Type: **${StickerTypeNames[sticker.type]}**`
                ].join("\n"), false)
                .toJSON()
            );
        }

        if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.STICKER_DELETE,
                limit:      50
            });
            const ids = removedStickers.map(s => s.id);
            const entry = auditLog.entries.find(e => e.targetID !== null && ids.includes(e.targetID));
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Sticker Deleted: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) embed.addField("Reason", entry.reason, false);
                embeds.push(embed.toJSON());
            }
        }
        for (const log of eventsDelete) {
            await log.execute(this, { embeds });
        }
    }

    if (eventsUpdate.length > 0 && updatedStickers.length > 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const sticker of removedStickers) {
            const old = oldStickers.find(e => e.id === sticker.id)!;
            if (sticker.description !== old.description) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Sticker Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Sticker: **${sticker.name}** (${sticker.id})`,
                        "This sticker's description was updated."
                    ])
                    .addField("Old Description", old.description ?? "None", true)
                    .addField("New Description", sticker.description ?? "None", true)
                    .toJSON()
                );
            }

            if (sticker.name !== old.name) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Sticker Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Sticker: **${sticker.name}** (${sticker.id})`,
                        "This sticker's name was updated."
                    ])
                    .addField("Old Name", old.name, true)
                    .addField("New Name", sticker.name, true)
                    .toJSON()
                );
            }

            if (sticker.sortValue !== old.sortValue) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Sticker Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Sticker: **${sticker.name}** (${sticker.id})`,
                        "This sticker's sort value was updated."
                    ])
                    .addField("Old Sort Value", (old.sortValue ?? "None").toString(), true)
                    .addField("New Sort Value", (sticker.sortValue ?? "None").toString(), true)
                    .toJSON()
                );
            }

            if (sticker.tags !== old.tags) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Sticker Updated")
                    .setColor(Colors.gold)
                    .setDescription([
                        `Sticker: **${sticker.name}** (${sticker.id})`,
                        "This sticker's tags were updated."
                    ])
                    .addField("Old Tags", old.tags, true)
                    .addField("New Tags", sticker.tags, true)
                    .toJSON()
                );
            }

            if (embeds.length === 0) return;

            if (guild instanceof Guild && guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
                const auditLog = await guild.getAuditLog({
                    actionType: AuditLogActionTypes.STICKER_UPDATE,
                    limit:      50
                });
                const ids = updatedStickers.map(s => s.id);
                const entry = auditLog.entries.find(e => e.targetID !== null && ids.includes(e.targetID));
                if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                    const embed = Util.makeEmbed(true)
                        .setTitle("Sticker Updated: Blame")
                        .setColor(Colors.gold)
                        .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                    if (entry.reason) embed.addField("Reason", entry.reason, false);
                    embeds.push(embed.toJSON());
                }
            }

            for (const log of eventsUpdate) {
                await log.execute(this, { embeds });
            }
        }
    }
});
