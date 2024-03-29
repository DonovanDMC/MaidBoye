import type { ComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import { State } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import GuildConfig from "../../../../db/Models/GuildConfig.js";
import Util from "../../../../util/Util.js";
import Settings from "../../../../util/settings/index.js";
import Config from "../../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ComponentTypes, type MessageActionRow, type User } from "oceanic.js";
import assert from "node:assert";

export function formatEmbed(page: number, gConfig: GuildConfig, author: User) {
    const settings = Settings.getPage(page);
    assert(settings && settings.length !== 0, "failed to find any settings to display");
    return Util.makeEmbed(true, author)
        .setTitle("Server Settings")
        .setDescription(
            settings.map(s => [
                `${s.emoji ?? ""} **${s.name}**`,
                `${Config.emojis.default.dot} Current Value: ${s.formatValue(s.getValue(gConfig))}`,
                `${Config.emojis.default.dot} Valid Values: ${s.validValues}`,
                `${Config.emojis.default.dot} Description: ${s.description}`,
                ""
            ].join("\n"))
        )
        .setFooter(`UwU | Page ${page + 1}/${Settings.getPageCount()}`)
        .toJSON();
}

export function changePage(page: number, interaction: ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig) {
    const settings = Settings.getPage(page);
    assert(settings && settings.length !== 0, "failed to find any settings to display");
    return interaction.editParent(Util.replaceContent({
        embeds: [
            formatEmbed(page,  gConfig, interaction.user)
        ],
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "settings", "nav").with("dir", 0).with("page", page).encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "settings", "nav").with("dir", 1).with("page", page).encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.exit(interaction.user.id),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                label:    "Exit",
                style:    ButtonColors.BLURPLE
            })
            .addSelectMenu({
                customID:  State.new(interaction.user.id, "settings", "configure").encode(),
                maxValues: 1,
                minValues: 1,
                options:   settings.map(s => ({
                    label:       s.name,
                    value:       s.interactionsName,
                    description: s.shortDescription,
                    emoji:       s.emoji ? ComponentBuilder.emojiToPartial(s.emoji, s.emojiType) : undefined
                })),
                placeholder: "Select A Setting To Configure",
                type:        ComponentTypes.STRING_SELECT
            })
            .toJSON()
    }));
}

export default class SettingsMenuComponent extends BaseComponent {
    action = "menu";
    command = "settings";
    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, data: BaseState & { page: number; }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        await changePage(data.page, interaction, gConfig);
    }
}
