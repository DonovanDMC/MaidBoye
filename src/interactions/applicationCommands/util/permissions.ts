import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { PermissionsByName } from "../../../util/Names.js";
import { ApplicationCommandOptionTypes, type PermissionName, Permissions } from "oceanic.js";

export default new Command(import.meta.url, "permissions")
    .setDescription("List the permissions of a user")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to list the permissions of")
    )
    .setValidLocation(ValidLocation.GUILD)
    .setOptionsParser(interaction => ({
        member: interaction.data.options.getMember("user") || interaction.member
    }))
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { member }) {
        const permAllowed = [] as Array<PermissionName>;
        const permDenied = [] as Array<PermissionName>;
        Object
            .entries(Permissions)
            .map(([name, perm]) =>
                (((member.permissions.allow & perm) === perm) ? permAllowed : permDenied).push(name as PermissionName)
            );

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Permissions for ${member.tag}`)
                .setDescription([
                    "```diff",
                    ...permAllowed.map(p => `+ ${PermissionsByName[p] || p}`),
                    ...permDenied.map(p => `- ${PermissionsByName[p] || p}`),
                    "```"
                ])
                .toJSON(true)
        });
    });
