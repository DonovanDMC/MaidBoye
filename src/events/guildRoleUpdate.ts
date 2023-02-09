import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { getRoleManagedType, PermissionsByName } from "../util/Names.js";
import { AuditLogActionTypes, type EmbedOptions, Permission, type PermissionName } from "oceanic.js";

export default new ClientEvent("guildRoleUpdate", async function guildRoleUpdateEvent(role, oldRole) {
    if (oldRole === null) {
        return;
    }
    const events = await LogEvent.getType(role.guildID, LogEvents.ROLE_UPDATE);
    if (events.length === 0) {
        return;
    }
    const embeds: Array<EmbedOptions> = [];

    if (role.color !== oldRole.color) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: ${role.mention}`,
                "This role's color was changed."
            ])
            .addField("Old Color", oldRole.color === 0 ? "[NONE]" : `#${oldRole.color.toString(16).padStart(6, "0").toUpperCase()}`, false)
            .addField("New Color", role.color === 0 ? "[NONE]" : `#${role.color.toString(16).padStart(6, "0").toUpperCase()}`, false)
            .toJSON()
        );
    }

    if (role.hoist !== oldRole.hoist) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: ${role.mention}`,
                `This role was ${role.hoist ? "hoisted" : "unhoisted"}.`
            ])
            .toJSON()
        );
    }

    if (role.mentionable !== oldRole.mentionable) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: ${role.mention}`,
                `This role was made ${role.mentionable ? "mentionable" : "unmentionable"}.`
            ])
            .toJSON()
        );
    }

    if (role.name !== oldRole.name) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: ${role.mention}`,
                "This role's name was changed."
            ])
            .addField("Old Name", oldRole.name, false)
            .addField("New Name", role.name, false)
            .toJSON()
        );
    }

    if (role.permissions.allow.toString() !== oldRole.permissions.allow) {
        const oldPermissions = Object.entries(new Permission(oldRole.permissions.allow).json).filter(([,b]) => b === true).map(([a]) => a) as Array<PermissionName>;
        const newPermissions = Object.entries(role.permissions.json).filter(([,b]) => b === true).map(([a]) => a) as Array<PermissionName>;
        const addedPermissions = [] as Array<PermissionName>;
        const removedPermissions = [] as Array<PermissionName>;
        for (const p of oldPermissions) {
            if (!newPermissions.includes(p)) {
                removedPermissions.push(p);
            }
        }
        for (const p of newPermissions) {
            if (!oldPermissions.includes(p)) {
                addedPermissions.push(p);
            }
        }
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: <@&${role.id}>`,
                "The role's permissions were changed.",
                "",
                "**Changes**:",
                "```diff",
                ...addedPermissions.map(p => `+ ${PermissionsByName[p]}`),
                ...removedPermissions.map(p => `- ${PermissionsByName[p]}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (role.managed !== oldRole.managed || JSON.stringify(role.tags) !== JSON.stringify(oldRole.tags)) {
        const managedType = await getRoleManagedType(role);
        const og = role.tags;
        role.tags = oldRole.tags;
        const oldManagedType = await getRoleManagedType(role);
        role.tags = og;
        embeds.push(Util.makeEmbed(true)
            .setTitle("Role Updated")
            .setColor(Colors.gold)
            .setDescription([
                `Role: ${role.mention}`,
                "This role's managed status was changed."
            ])
            .addField("Old Managed Status", oldManagedType || "None", false)
            .addField("New Managed Status", managedType || "None", false)
            .toJSON()
        );
    }

    if (role.guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
        const entry = Util.getAuditLogEntry(role.guild, AuditLogActionTypes.ROLE_UPDATE, e => e.targetID === role.id);
        if (entry?.user && entry.isRecent) {
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
