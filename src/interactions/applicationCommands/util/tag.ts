import Command, { CommandInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type GuildConfig from "../../../db/Models/GuildConfig.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import type MaidBoye from "../../../main.js";
import Config from "../../../config/index.js";
import chunk from "chunk";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { assert } from "tsafe";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, InteractionContent, MessageActionRow } from "oceanic.js";

async function getTag(client: MaidBoye, name: string, info: GuildConfig["tags"][string], index: number, page: number, WithContent: boolean) {
    const creator = await client.getUser(info.createdBy);
    const modifier = info.modifiedBy === null ? null : await client.getUser(info.modifiedBy);
    return [
        `#${(index + 1) + (page - 1) * 10} - \`${name}\``,
        `Created By: ${creator === null ? `<@!${info.createdBy}>` : creator.tag}`,
        `Created At: ${Util.formatDiscordTime(info.createdAt, "long-datetime")}`,
        ...(WithContent ? ["Content:", Strings.truncateWords(info.content, 750)] : []),
        ...((info.modifiedAt && info.modifiedBy && info.previousContent) ? [
            "",
            "-- Last Modification --",
            `Modified By: ${modifier === null ? info.modifiedBy : `**${modifier.tag}** (<@!${modifier.id}>)`}`,
            `Modified At: ${Util.formatDiscordTime(info.modifiedAt, "long-datetime", true)}`,
            ...(WithContent ? ["Previous Content:", Strings.truncateWords(info.previousContent, 750)] : [])
        ] : [])
    ].join("\n");
}

export async function getPage(interaction: CommandInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, page = 1) {
    const tags = chunk(Object.entries(gConfig.tags), 10);
    return {
        embeds: Util.makeEmbed(true, interaction.user)
            .setDescription(await Promise.all(tags[page - 1].map(async([name, info], index) => getTag(interaction.client as MaidBoye, name, info, index, page, false)).join("\n\n")))
            .setFooter(`UwU | Page ${page}/${tags.length}`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "tag", "nav").with("page", page - 1).encode(),
                disabled: page === 1,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "tag", "nav").with("page", page + 1).encode(),
                disabled: page === tags.length,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    } as InteractionContent;
}

export default new Command(import.meta.url, "tag")
    .setDescription("Manage this server's tags")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List this server's tags")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "page")
                    .setDescription("The page of tags to list")
                    .setMinMax(1)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "get")
            .setDescription("Get the contents of a tag")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                    .setDescription("The name of the tag to get")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "info")
            .setDescription("Get information about a tag")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                    .setDescription("The name of the tag to get information about")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "create")
            .setDescription("[Management] Create a tag")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                    .setDescription("The name of the tag")
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "content")
                    .setDescription("The content of the tag")
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "modify")
            .setDescription("[Management] Modify a tag")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                    .setDescription("The name of the tag to modify")
                    .setAutocomplete()
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "content")
                    .setDescription("The new content of the tag")
                    .setRequired()
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "delete")
            .setDescription("[Management] Delete a tag")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "name")
                    .setDescription("The name of the tag to delete")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .setOptionsParser(interaction => ({
        type:    interaction.data.options.getSubCommand<["list" | "get" | "info" | "create" | "modify" | "delete"]>(true),
        name:    interaction.data.options.getString("name"),
        page:    interaction.data.options.getInteger("page") || 1,
        content: interaction.data.options.getString("content")
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck(async(interaction, { type: [type] }) => ["list", "create", "modify", "delete"].includes(type) ? "ephemeral" : "ephemeral-user")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { type: [type], name, page, content }, gConfig) {
        switch (type) {
            case "list": {
                if (gConfig.tagNames.length === 0) return interaction.reply({
                    content: "H-hey! This server doesn't have any tags.."
                });
                const pages = Math.ceil(gConfig.tagNames.length / 10);
                if (page > pages) return interaction.reply({ content: `H-hey! This server only has ${pages} page${pages === 1 ? "" : "s"} of tags..` });
                if (page < 1) return interaction.reply({ content: "H-hey! Page needs to be greater than one.." });

                return interaction.reply(await getPage(interaction, gConfig, page));
            }

            case "get": {
                assert(name);
                name = name.toLowerCase();
                if (!gConfig.tagNames.includes(name)) return interaction.reply({ content: `H-hey! I couldn't find a tag by the name of "${name}"..` });
                return interaction.reply({ content: gConfig.tags[name].content });
            }

            case "info": {
                assert(name);
                name = name.toLowerCase();
                if (!gConfig.tagNames.includes(name)) return interaction.reply({ content: `H-hey! I couldn't find a tag by the name of "${name}"..` });
                const tag = await getTag(interaction.client as MaidBoye, name, gConfig.tags[name], gConfig.tagNames.indexOf(name) % 10, Math.ceil(gConfig.tagNames.indexOf(name) / 10) + 1, true);
                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setTitle(`Tag: ${name}`)
                        .setDescription(tag)
                        .toJSON(true)
                });
            }

            case "create": {
                if (!interaction.member.permissions.has("MANAGE_MESSAGES")) return interaction.reply({ content: "H-hey! You don't have permission to do that.." });
                assert(name && content);
                if (gConfig.tagNames.length >= 50) return interaction.reply({ content: "H-hey! This server already has the maximum amount of tags.." });
                if (name.length > 50) return interaction.reply({ content: "H-hey! That name is too long.." });
                if (content.length > 750) return interaction.reply({ content: "H-hey! Tags can only be 750 characters long.." });
                if (gConfig.tagNames.includes(name)) return interaction.reply({ content: "H-hey! This server already has a tag with that name.." });
                gConfig.tags[name] = {
                    content,
                    createdAt:       Date.now(),
                    createdBy:       interaction.user.id,
                    modifiedAt:      null,
                    modifiedBy:      null,
                    previousContent: null
                };
                await gConfig.edit({ tags: gConfig.tags });
                return interaction.reply({ content: `A tag with the name "${name}" has been created` });
            }

            case "modify": {
                if (!interaction.member.permissions.has("MANAGE_MESSAGES")) return interaction.reply({ content: "H-hey! You don't have permission to do that.." });
                assert(name && content);
                if (!gConfig.tagNames.includes(name)) return interaction.reply({ content: "H-hey! This server doesnt have a tag with that name.." });
                if (content.length > 750) return interaction.reply({ content: "H-hey! Tags can only be 750 characters long.." });
                gConfig.tags[name] = {
                    ...gConfig.tags[name]!,
                    content,
                    modifiedAt:      Date.now(),
                    modifiedBy:      interaction.user.id,
                    previousContent: gConfig.tags[name]!.content
                };
                await gConfig.edit({ tags: gConfig.tags });
                return interaction.reply({ content: `The content of the tag "${name}" has been updated` });
            }

            case "delete": {
                if (!interaction.member.permissions.has("MANAGE_MESSAGES")) return interaction.reply({ content: "H-hey! You don't have permission to do that.." });
                assert(name);
                if (!gConfig.tagNames.includes(name)) return interaction.reply({ content: "H-hey! This server doesnt have a tag with that name.." });
                delete gConfig.tags[name];
                await gConfig.edit({ tags: gConfig.tags });
                return interaction.reply({ content: `The tag "${name}" has been deleted` });
            }
        }
    });
