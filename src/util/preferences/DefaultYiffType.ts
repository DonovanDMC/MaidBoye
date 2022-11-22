import BasePreference from "./structure/BasePreference.js";
import Config from "../../config/index.js";
import Util from "../Util.js";
import { State } from "../State.js";
import type { YiffTypes } from "../../db/Models/UserConfig.js";
import type { CommandInteraction, ComponentInteraction, SelectMenuComponentInteraction } from "../cmd/Command.js";
import CommandOption from "../cmd/CommandOption.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { Strings } from "@uwu-codes/utils";
import { assert } from "tsafe";
import { ApplicationCommandOptionTypes, ComponentTypes, MessageActionRow } from "oceanic.js";

export default class DefaultYiffTypePreference extends BasePreference {
    description = "The default yiff type for the `yiff` command. This overrides server settings.";
    emoji = Config.emojis.shared.yiff;
    emojiType = "custom" as const;
    name = "Default Yiff Type";
    validValues = Config.yiffTypes.map(v => `\`${v}\``).join(", ");
    get interactionsOption() {
        return new CommandOption(ApplicationCommandOptionTypes.SUB_COMMAND, this.interactionsName)
            .setDescription(this.description)
            .addOption(
                new CommandOption(ApplicationCommandOptionTypes.STRING, "value")
                    .setDescription("the value to use")
                    .setRequired()
                    .setChoices(Config.yiffTypes.map(v => ({
                        name:  Strings.ucwords(v),
                        value: v
                    })))
            );
    }
    override get shortDescription() {
        return "The default yiff type for the `yiff` command.";
    }

    protected validateInput(value: string) {
        return Config.yiffTypes.includes(value as "gay");
    }

    override formatValue(value: string) {
        return `\`${value}\``;
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.defaultYiffType;
    }

    override async handleInteraction(interaction: CommandInteraction, uConfig: UserConfig, value: YiffTypes) {
        assert(this.validateInput(value), `failed to validate input for preference "${this.name}" (${value})`);
        const currentValue = this.getValue(uConfig);
        if (currentValue === value) {
            await this.handleDuplicate(interaction, this.name, value);
            return;
        }

        await uConfig.setDefaultYiffType(value);
        await interaction.editOriginal(Util.replaceContent({
            content:    `**${this.name}** has been updated to \`${this.formatValue(value)}\`.`,
            components: new ComponentBuilder<MessageActionRow>(2)
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "preferences", "open").with("preference", this.id).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    label:    "Back",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        }));
    }

    override async handlePick(interaction: ComponentInteraction, uConfig: UserConfig, value: YiffTypes) {
        assert(this.validateInput(value), `failed to validate input for preference "${this.name}" (${value})`);
        const currentValue = this.getValue(uConfig);
        await this.genericHandlePick<YiffTypes>(interaction, this.name, currentValue, value, val => uConfig.setDefaultYiffType(val));
    }

    override async open(interaction: SelectMenuComponentInteraction, uConfig: UserConfig) {
        const currentValue = this.getValue(uConfig);
        await interaction.editParent(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`User Preferences: ${this.name}`)
                .setDescription(`Please select an option from below.\nCurrent Value: ${currentValue ? this.formatValue(currentValue) : "**NONE**"}`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(2)
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "preferences", "menu").with("page", this.page).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    label:    "Back",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .addSelectMenu({
                    customID:  State.new(interaction.user.id, "preferences", "pick", 2).with("preference", this.id).encode(),
                    maxValues: 1,
                    minValues: 1,
                    options:   Config.yiffTypes.map(type => ({
                        label: Strings.ucwords(type),
                        value: type
                    })),
                    placeholder: "Select An Option",
                    type:        ComponentTypes.STRING_SELECT
                })
                .toJSON()
        }));
    }
}
