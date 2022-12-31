import Command, { type CommandInteraction, type ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type MaidBoye from "../../../main.js";
import Strike from "../../../db/Models/Strike.js";
import Warning from "../../../db/Models/Warning.js";
import ModLog, { ModLogType } from "../../../db/Models/ModLog.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import { UserCommand } from "../../../util/cmd/OtherCommand.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import chunk from "chunk";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, InteractionTypes, type MessageActionRow, type User } from "oceanic.js";

export async function mainMenu(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, user: User) {
    const strikes = await Strike.getForUser(interaction.guildID, user.id, "DESC");
    const warnings = await Warning.getForUser(interaction.guildID, user.id, "DESC");
    const modlog = (await ModLog.getForUser(interaction.guildID, user.id)).filter(m => ![ModLogType.WARNING, ModLogType.DELETE_WARNING, ModLogType.CLEAR_WARNINGS].includes(m.type));
    await (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))(Util.replaceContent({
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`Inspection: ${user.tag}`)
            .setDescription([
                `Total Strikes: **${strikes.reduce((a, b) => a + b.amount, 0)}**`,
                `Total Moderation Entries: **${modlog.length}**`,
                `Total Warnings: **${warnings.length}**`,
                "",
                `Most Recent Strike: ${strikes.length === 0 ? "**Never**" : Util.formatDiscordTime(strikes[0].createdAt.getTime(), "relative", true)}`,
                `Most Recent Moderation Entry: ${modlog.length === 0 ? "**Never**" : Util.formatDiscordTime(modlog[0].createdAt.getTime(), "relative", true)}`,
                `Most Recent Warning: ${warnings.length === 0 ? "**Never**" : Util.formatDiscordTime(warnings[0].createdAt.getTime(), "relative", true)}`
            ].join("\n"))
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "strikes").with("page", 1).encode(),
                label:    "Strike History",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "mod").with("page", 1).encode(),
                label:    "Moderation History",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "warnings").with("page", 1).encode(),
                label:    "Warning History",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    }));
}

export async function strikeHistory(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, user: User, page: number) {
    const strikes = await Strike.getForUser(interaction.guildID, user.id, "DESC");
    const pages = chunk(strikes, 5);
    await (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))(Util.replaceContent({
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`Strike History: ${user.tag}`)
            .setDescription(strikes.length === 0 ? "This user has no strike history." : (await Promise.all(pages[page - 1].map(async entry => `**${entry.amount}** Strike${entry.amount === 1 ? "" : "s"} [type: **${entry.typeName.toLowerCase()}**] added by ${entry.blameID === null ? "**Internal Error**" : `<@!${entry.blameID}>`} on ${Util.formatDiscordTime(entry.createdAt.getTime(), "short-datetime", true)}`))).join("\n"))
            .setFooter(strikes.length === 0 ? "UwU" : `UwU | Page ${page}/${pages.length}`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "strikes").with("page", page - 1).encode(),
                disabled: page === 1,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "home").encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.home, "default"),
                label:    "Home",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "strikes").with("page", page + 1).encode(),
                disabled: strikes.length === 0 || page === strikes.length,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    }));
}

export async function modHistory(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, user: User, page: number) {
    // this isn't using an actual array
    // eslint-disable-next-line unicorn/no-array-method-this-argument
    const modlog = (await ModLog.getForUser(interaction.guildID, user.id)).filter(m => ![ModLogType.WARNING, ModLogType.DELETE_WARNING, ModLogType.CLEAR_WARNINGS].includes(m.type), "DESC");
    const pages = chunk(modlog, 5);
    await (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))(Util.replaceContent({
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`Strike History: ${user.tag}`)
            .setDescription(modlog.length === 0 ? "This user has no moderation history." : (await Promise.all(pages[page - 1].map(async entry => {
                const blame = (await this.getUser(entry.blameID || this.user.id)) || { id: "000000000000000000", tag: "Unknown#0000" };
                return [
                    `Case: **#${entry.caseID}**`,
                    `Type: **${entry.typeName}**`,
                    `Blame: <@!${blame.id}> (\`${blame.tag}\`)`,
                    `Reason: ${Strings.truncateWords(entry.reason, 75)}`,
                    `Date Created: ${Util.formatDiscordTime(entry.createdAt.getTime(), "short-datetime", true)}`
                ].join("\n");
            }))).join("\n"))
            .setFooter(modlog.length === 0 ? "UwU" : `UwU Page ${page}/${pages.length}`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "mod").with("page", page - 1).encode(),
                disabled: page === 1,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "home").encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.home, "default"),
                label:    "Home",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "mod").with("page", page + 1).encode(),
                disabled: modlog.length === 0 || page === modlog.length,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    }));
}

export async function warningHistory(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, user: User, page: number) {
    const warnings = await Warning.getForUser(interaction.guildID, user.id, "DESC");
    const pages = chunk(warnings, 5);
    await (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))(Util.replaceContent({
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`Strike History: ${user.tag}`)
            .setDescription(warnings.length === 0 ? "This user has no moderation history." : (await Promise.all(pages[page - 1].map(async entry => {
                const blame = (await this.getUser(entry.blameID || this.user.id)) || { id: "000000000000000000", tag: "Unknown#0000" };
                return [
                    `**#${entry.warningID}**`,
                    `Blame: <@!${blame.id}> (\`${blame.tag}\`)`,
                    `Reason: ${Strings.truncateWords(entry.reason, 75)}`,
                    `Date Created: ${Util.formatDiscordTime(entry.createdAt.getTime(), "short-datetime", true)}`
                ].join("\n");
            }))).join("\n"))
            .setFooter(warnings.length === 0 ? "UwU" : `UwU Page ${page}/${pages.length}`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "warnings").with("page", page - 1).encode(),
                disabled: page === 1,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "home").encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.home, "default"),
                label:    "Home",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "inspect", "nav").with("target", user.id).with("section", "warnings").with("page", page + 1).encode(),
                disabled: warnings.length === 0 || page === warnings.length,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    }));
}

export default new Command(import.meta.url, "inspect")
    .setDescription("Get the moderation info of a user.")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "member")
            .setDescription("The user to inspect.")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "section")
            .setDescription("The section to open.")
            .setChoices([
                {
                    name:  "Strike History",
                    value: "strikes"
                },
                {
                    name:  "Moderation History",
                    value: "mod"
                },
                {
                    name:  "Warning History",
                    value: "warnings"
                }
            ])
    )
    .setAck("ephemeral")
    .setValidLocation(ValidLocation.GUILD)
    .setOptionsParser(async interaction => ({
        user:    interaction.data.options.getUser("member", true),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        section: (interaction.data.options.getString("section") || "menu") as "strikes" | "mod" | "warnings" | "home"
    }))
    .setExecutor(async function(interaction, { user, section }) {
        switch (section) {
            case "strikes": {
                return strikeHistory.call(this, interaction, user, 1);
            }
            case "mod": {
                return modHistory.call(this, interaction, user, 1);
            }
            case "warnings": {
                return warningHistory.call(this, interaction, user, 1);
            }
            case "home": {
                return mainMenu.call(this, interaction, user);
            }
        }
    });

export const userCommand = new UserCommand(import.meta.url, "Inspect User")
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction) {
        return mainMenu.call(this, interaction, interaction.data.target as User);
    });
