import Command, { CommandInteraction, ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type MaidBoye from "../../../main.js";
import type GuildConfig from "../../../db/Models/GuildConfig.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import Config from "../../../config/index.js";
import chunk from "chunk";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, InteractionContent, MessageActionRow } from "oceanic.js";
import assert from "node:assert";

export async function getPage(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, page: number) {
    const pages = chunk(gConfig.levelingRoles, 10);
    return {
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle("Level Roles List")
            .setDescription(pages[page - 1].map(([role, level]) => `<@&${role}> - **level ${level}**`))
            .setFooter(`Page ${page + 1}/${pages.length} | UwU`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "levelroles", "nav").with("page", page - 1).encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.exit(interaction.user.id),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                label:    "Exit",
                style:    ButtonColors.RED
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "levelroles", "nav").with("page", page + 1).encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    } as InteractionContent;
}

export default new Command(import.meta.url, "levelroles")
    .setDescription("Manage this servers level up roles")
    .setPermissions("user", "MANAGE_ROLES")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "add")
            .setDescription("Add a leveling role")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.ROLE, "role")
                    .setDescription("The role users gain when the reach the specified level")
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "level")
                    .setDescription("The level at which users gain the specified role")
                    .setMinMax(1, 5000)
                    .setRequired()
            )
    )

    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "remove")
            .setDescription("Remove a leveling role")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.ROLE, "role")
                    .setDescription("The role to remove")
                    .setRequired()
            )
    )

    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List the leveling roles")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        type:  interaction.data.options.getSubCommand<["add" | "remove" | "list"]>(true)[0],
        role:  interaction.data.options.getRole("role"),
        level: interaction.data.options.getInteger("level")
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setGuildLookup(true)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { type, role, level }, gConfig) {
        switch (type) {
            case "add": {
                assert(role && level);
                if (gConfig.levelingRolesList.length >= 25) {
                    return interaction.reply({
                        content: "H-hey! This server already has the maximum amount of leveling roles.."
                    });
                }
                if (gConfig.levelingRolesLevelMap[level]?.includes(role.id)) {
                    return interaction.reply({
                        content: "H-hey! That role has already been added for that level.."
                    });
                }
                if (gConfig.levelingRolesRoleMap[role.id]) {
                    return interaction.reply({
                        content: `H-hey! That role has already been added to the level **${gConfig.levelingRolesRoleMap[role.id]!}**..`
                    });
                }
                if (Util.compareRoleToMember(role, interaction.member) !== "lower") {
                    return interaction.reply({
                        content: "H-hey! You have to chose a role that's lower than your top role.."
                    });
                }
                if (Util.compareRoleToMember(role, interaction.channel.guild.clientMember) !== "lower") {
                    return interaction.reply({
                        content: "H-hey! I have to chose a role that's lower than my top role.."
                    });
                }
                await gConfig.addLevelingRole(role.id, level);
                // await db.query(`UPDATE ${GuildConfig.TABLE} SET leveling_roles=ARRAY[${[...gConfig.levelingRoles, [role.id, level]].map(([r, l]) => `ROW('${r}', ${l})::LEVELING_ROLE`).join(", ")}], updated_at=CURRENT_TIMESTAMP(3) WHERE id = $1`, [interaction.guildID]);
                return interaction.reply({
                    content:         `Members will not gain the role <@&${role.id}> when they reach the level **${level}**\n(if they are already this level, they will get it the next time they level up)`,
                    allowedMentions: {
                        roles: false
                    }
                });
            }

            case "remove" : {
                assert(role);
                if (gConfig.levelingRoles.length === 0) {
                    return interaction.reply({
                        content: "H-hey! This server has no leveling roles.."
                    });
                }
                if (!gConfig.levelingRolesRoleMap[role.id]) {
                    return interaction.reply({
                        content: "H-hey! That role hasn't been added to any level.."
                    });
                }
                await gConfig.removeLevelingRole(role.id);
                return interaction.reply({
                    content: `Removed <@&${role.id}> from the level **${gConfig.levelingRolesRoleMap[role.id]!}**`
                });
            }

            case "list": {
                if (gConfig.levelingRoles.length === 0) {
                    return interaction.reply({
                        content: "H-hey! This server has no leveling roles.."
                    });
                }
                const page = await getPage.call(this, interaction, gConfig, 1);
                return interaction.reply(page);
            }
        }
    });
