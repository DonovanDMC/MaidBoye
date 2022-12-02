import type { ComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import { State } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import Util from "../../../../util/Util.js";
import Preferences from "../../../../util/preferences/index.js";
import UserConfig from "../../../../db/Models/UserConfig.js";
import Config from "../../../../config/index.js";
import { ComponentTypes, MessageActionRow, User } from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import assert from "node:assert";

export function formatEmbed(page: number, uConfig: UserConfig, author: User) {
    const preferences = Preferences.getPage(page);
    assert(preferences && preferences.length !== 0, "failed to find any preferences to display");
    return Util.makeEmbed(true, author)
        .setTitle("User Preferences")
        .setDescription(
            preferences.map(s => [
                `${s.emoji ?? ""} **${s.name}**`,
                `${Config.emojis.default.dot} Current Value: ${s.formatValue(s.getValue(uConfig))}`,
                `${Config.emojis.default.dot} Valid Values: ${s.validValues}`,
                `${Config.emojis.default.dot} Description: ${s.description}`,
                ""
            ].join("\n"))
        )
        .setFooter(`UwU | Page ${page + 1}/${Preferences.getPageCount()}`)
        .toJSON();
}

export function changePage(page: number, interaction: ComponentInteraction<ValidLocation.BOTH>, uConfig: UserConfig) {
    const preferences = Preferences.getPage(page);
    assert(preferences && preferences.length !== 0, "failed to find any preferences to display");
    return interaction.editParent(Util.replaceContent({
        embeds: [
            formatEmbed(page, uConfig, interaction.user)
        ],
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "preferences", "nav").with("dir", 0).with("page", page).encode(),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "preferences", "nav").with("dir", 1).with("page", page).encode(),
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
                customID:  State.new(interaction.user.id, "preferences", "configure").encode(),
                maxValues: 1,
                minValues: 1,
                options:   preferences.map(s => ({
                    label:       s.name,
                    value:       s.interactionsName,
                    description: s.shortDescription,
                    emoji:       s.emoji ? ComponentBuilder.emojiToPartial(s.emoji, s.emojiType) : undefined
                })),
                placeholder: "Select A Preference To Configure",
                type:        ComponentTypes.STRING_SELECT
            })
            .toJSON()
    }));
}

export default class PreferencesMenuComponent extends BaseComponent {
    action = "menu";
    command = "preferences";
    override async handle(interaction: ComponentInteraction, data: BaseState & { page: number; }) {
        const uConfig = await UserConfig.get(interaction.user.id);
        await changePage(data.page, interaction, uConfig);
    }
}
