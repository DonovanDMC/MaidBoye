import BasePreference from "./structure/BasePreference.js";
import Config from "../../config/index.js";
import Util from "../Util.js";
import { State } from "../State.js";
import type { CommandInteraction, ComponentInteraction, SelectMenuComponentInteraction } from "../cmd/Command.js";
import type { E621ThumbnailType } from "../../db/Models/UserConfig.js";
import CommandOption from "../cmd/CommandOption.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, ComponentTypes, type MessageActionRow } from "oceanic.js";
import assert from "node:assert";

export default class E621ThumbnailTypePreference extends BasePreference {
    description = "The thumbnail type for webm posts in the `e621` command. This overrides server settings.";
    emoji = Config.emojis.shared.thumbnail;
    emojiType = "custom" as const;
    name = "E621 Thumbnail Type";
    validValues = Config.e621ThumbnailTypes.map(v => `\`${v}\``).join(", ");

    get interactionsOption() {
        return new CommandOption(ApplicationCommandOptionTypes.SUB_COMMAND, this.interactionsName)
            .setDescription(this.description)
            .addOption(
                new CommandOption(ApplicationCommandOptionTypes.STRING, "value")
                    .setDescription("the value to use")
                    .setRequired()
                    .setChoices(Config.e621ThumbnailTypes.map(v => ({
                        name:  v,
                        value: v
                    })))
            );
    }

    override get shortDescription() {
        return "The thumbnail type for e621 webm posts.";
    }

    protected validateInput(value: string) {
        return Config.e621ThumbnailTypes.includes(value as "none");
    }

    override formatValue(value: string) {
        return `\`${value}\``;
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.e621ThumbnailType;
    }

    override async handleInteraction(interaction: CommandInteraction, uConfig: UserConfig, value: E621ThumbnailType) {
        assert(this.validateInput(value), `failed to validate input for preference "${this.name}" (${value})`);
        const currentValue = this.getValue(uConfig);
        if (currentValue === value) {
            await this.handleDuplicate(interaction, this.name, value);
            return;
        }

        await uConfig.setE621ThumbnailType(value);
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

    override async handlePick(interaction: ComponentInteraction, uConfig: UserConfig, value: E621ThumbnailType) {
        assert(this.validateInput(value), `failed to validate input for preference "${this.name}" (${value})`);
        const currentValue = this.getValue(uConfig);
        await this.genericHandlePick<E621ThumbnailType>(interaction, this.name, currentValue, value, val => uConfig.setE621ThumbnailType(val));
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
                    customID: State.new(interaction.user.id, "preferences", "pick", 1).with("preference", this.id).with("value",null).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                    label:    "Reset (No Value)",
                    style:    ButtonColors.GREY
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
                    options:   [
                        {
                            label: "Gif",
                            value: "gif",
                            emoji: ComponentBuilder.emojiToPartial(Config.emojis.shared.gif, "custom")
                        },
                        {
                            label: "Image",
                            value: "image",
                            emoji: ComponentBuilder.emojiToPartial(Config.emojis.shared.thumbnail, "custom")
                        },
                        {
                            label: "None",
                            value: "none",
                            emoji: ComponentBuilder.emojiToPartial(Config.emojis.default.none, "default")
                        }
                    ],
                    placeholder: "Select An Option",
                    type:        ComponentTypes.STRING_SELECT
                })
                .toJSON()
        }));
    }
}
