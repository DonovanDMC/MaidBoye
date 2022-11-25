import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { PermissionsByName } from "../../../util/Names.js";
import type { ModeratorPermissions } from "../../../util/Constants.js";
import { Colors, moderatorPermissions, AllPermissions } from "../../../util/Constants.js";
import { State } from "../../../util/State.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "selfroles")
    .setDescription("Add/remove & join/leave roles")
    .setPermissions("bot", "MANAGE_ROLES")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List this server's self assignable roles")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "join")
            .setDescription("Join a self assignable role")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "role")
                    .setDescription("The role to join")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "leave")
            .setDescription("Leave a self assignable role")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "role")
                    .setDescription("The role to leave")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "add")
            .setDescription("[Management] Make a role self assignable")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.ROLE, "role")
                    .setDescription("The role to make self assignable")
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "remove")
            .setDescription("[Management] Remove a role from the self assignable list")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "role")
                    .setDescription("The role to remove from the list")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .setOptionsParser(interaction => ({
        type: interaction.data.options.getSubCommand<["list" | "join" | "leave" | "add" | "remove"]>(true),
        role: interaction.data.options.getRoleOption("role")?.value
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { type: [type], role }, gConfig) {
        switch (type) {
            case "list": {
                if (gConfig.selfroles.length === 0) {
                    return interaction.reply({ content: "H-hey! This server doesn't have any self assignable roles.." });
                }
                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle("Self Roles List")
                        .setDescription(gConfig.selfroles.map(r => `- <@&${r}>`).join("\n"))
                        .toJSON(true)
                });
            }

            case "join": {
                if (!role || !gConfig.selfroles.includes(role)) {
                    return interaction.reply({ content: "H-hey! That selection was invalid.." });
                }
                const r = interaction.guild.roles.find(rl => rl.id === role);
                if (!r) {
                    gConfig.selfroles.splice(gConfig.selfroles.indexOf(role), 1);
                    await gConfig.edit({ selfroles: gConfig.selfroles });
                    return interaction.reply({ content: "H-hey! I couldn't find the role you selected.." });
                }
                if (interaction.member.roles.includes(role)) {
                    return interaction.reply({ content: "H-hey! You already have that role.." });
                }
                if (Util.compareRoleToMember(r, interaction.guild.clientMember) !== "lower") {
                    return interaction.reply({ content: "H-hey! I can't assign that role as it's higher than or as high as my highest role.. Please contact a server administrator" });
                }
                await interaction.member.addRole(role, `SelfRoles: ${interaction.user.tag} (${interaction.user.id})`);
                return interaction.reply({ content: `Congrats, you now have the <@&${role}> role` });
            }

            case "leave": {
                if (!role || !gConfig.selfroles.includes(role)) {
                    return interaction.reply({ content: "H-hey! That selection was invalid.." });
                }
                const r = interaction.guild.roles.find(rl => rl.id === role);
                if (!r) {
                    gConfig.selfroles.splice(gConfig.selfroles.indexOf(role), 1);
                    await gConfig.edit({ selfroles: gConfig.selfroles });
                    return interaction.reply({ content: "H-hey! I couldn't find the role you selected.." });
                }
                if (!interaction.member.roles.includes(role)) {
                    return interaction.reply({ content: "H-hey! You don't have that role.." });
                }
                if (Util.compareRoleToMember(r, interaction.guild.clientMember) !== "lower") {
                    return interaction.reply({ content: "H-hey! I can't remove that role as it's higher than or as high as my highest role.. Please contact a server administrator" });
                }
                await interaction.member.removeRole(role, `SelfRoles: ${interaction.user.tag} (${interaction.user.id})`);
                return interaction.reply({
                    allowedMentions: { roles: false },
                    content:         `Congrats, you no longer have the <@&${role}> role`
                });
            }

            case "add": {
                if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                    return interaction.reply({ content: `H-hey! You need the **${PermissionsByName.MANAGE_ROLES}** permission..` });
                }
                const r = interaction.guild.roles.find(rl => rl.id === role);
                if (!role || !r) {
                    return interaction.reply({ content: "H-hey! I couldn't find the role you selected.." });
                }
                if (gConfig.selfroles.includes(role)) {
                    return interaction.reply({ content: "H-hey! That role is already self assignable.." });
                }
                if (Util.compareRoleToMember(r, interaction.guild.clientMember)  !== "lower") {
                    return interaction.reply({ content: "H-hey! That role is higher than or as high as my highest role, please fix that before trying to make it self assignable.." });
                }
                if (Util.compareRoleToMember(r, interaction.member)  !== "lower") {
                    return interaction.reply({ content: "H-hey! That role is higher than or as high as your highest role, you cannot make it assignable.." });
                }
                const modPerms: Array<ModeratorPermissions> = [];
                let perms = 0;
                for (const perm of AllPermissions) {
                    if (r.permissions.has(perm)) {
                        perms++;
                        if (moderatorPermissions.includes(perm as ModeratorPermissions)) {
                            modPerms.push(perm as ModeratorPermissions);
                        }
                    }
                }

                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle(modPerms.length === 0 ? "Confirmation" : "Warning: Role Contains Moderator Permissions")
                        .setDescription(`Are you sure you want to make <@&${role}> self assignable?\nIt has ${perms === 1 ? "**1** permission" : `**${perms}** total permissions`}, **${modPerms.length}** of which are moderator permissions.${modPerms.length === 0 ? "" : `\n\nModerator Permissions:\n${modPerms.map(p =>  `- **${PermissionsByName[p]}**`).join("\n")}`}`)
                        .setColor(modPerms.length === 0 ? Colors.orange : Colors.red)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "selfroles", "confirm-add").with("role", role).encode(),
                            label:    "Continue",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "Cancel",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }

            case "remove": {
                if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                    return interaction.reply({ content: `H-hey! You need the **${PermissionsByName.MANAGE_ROLES}** permission..` });
                }
                if (!role) {
                    return interaction.reply({ content: "H-hey! I couldn't find the role you selected.." });
                }
                const r = interaction.guild.roles.find(rl => rl.id === role);
                if (!r) {
                    gConfig.selfroles.splice(gConfig.selfroles.indexOf(role), 1);
                    await gConfig.edit({ selfroles: gConfig.selfroles });
                    return interaction.reply({ content: "H-hey! I couldn't find the role you selected, so it has automatically been removed.." });
                }
                if (!gConfig.selfroles.includes(role)) {
                    return interaction.reply({ content: "H-hey! That role isn't self assignable.." });
                }
                if (Util.compareRoleToMember(r,interaction.guild.clientMember) !== "lower") {
                    gConfig.selfroles.splice(gConfig.selfroles.indexOf(role), 1);
                    await gConfig.edit({ selfroles: gConfig.selfroles });
                    return interaction.reply({ content: "H-hey! The role you selected was found to be higher than or as high as my highest role, so it has automatically been removed.." });
                }

                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle("Confirmation")
                        .setDescription(`Are you sure you want to make <@&${role}> no longer self assignable?`)
                        .setColor(Colors.orange)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "selfroles", "confirm-remove").with("role", role).encode(),
                            label:    "Continue",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "Cancel",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }
        }
    });
