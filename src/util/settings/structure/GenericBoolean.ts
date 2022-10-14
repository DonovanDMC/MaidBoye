import BaseSetting from "./BaseSetting.js";
import type { ExcludedSettings, SettingsBits } from "../index.js";
import type GuildConfig from "../../../db/Models/GuildConfig.js";
import Util from "../../Util.js";
import { State } from "../../State.js";
import type { CommandInteraction, ComponentInteraction, SelectMenuComponentInteraction, ValidLocation } from "../../cmd/Command.js";
import CommandOption from "../../cmd/CommandOption.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { assert } from "tsafe";
import { ApplicationCommandOptionTypes, MessageActionRow } from "oceanic.js";

export enum Type {
    YES_NO           = 0,
    ENABLED_DISABLED = 1
}
export default abstract class BooleanSetting extends BaseSetting {
    private internalName: Exclude<keyof typeof SettingsBits, ExcludedSettings>;
    private type: Type;
    abstract override getValue(gConfig: GuildConfig): boolean;
    constructor(type: Type, internalName: Exclude<keyof typeof SettingsBits, ExcludedSettings>) {
        super();
        Object.defineProperties(this, {
            type: {
                configurable: false,
                enumerable:   false,
                writable:     false,
                value:        type
            },
            internalName: {
                configurable: false,
                enumerable:   false,
                writable:     false,
                value:        internalName
            }
        });
    }
    get interactionsOption() {
        return new CommandOption(ApplicationCommandOptionTypes.SUB_COMMAND, this.interactionsName)
            .setDescription(this.description)
            .addOption(
                new CommandOption(ApplicationCommandOptionTypes.BOOLEAN, "value")
                    .setDescription("the value to use")
                    .setRequired()
            );
    }
    override get validValues() {
        return this.type === Type.YES_NO ? "`yes` or `no`" : "`enabled` or `disabled`";
    }

    protected override validateInput(value: boolean) {
        return typeof value === "boolean";
    }

    override formatValue(value: boolean) {
        return `\`${this.type === Type.YES_NO ? (value ? "Yes" : "No") : (value ? "Enabled" : "Disabled")}\``;
    }

    override async handleInteraction(interaction: CommandInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: boolean) {
        assert(this.validateInput(value), `failed to validate input for setting "${this.name}" (${String(value)})`);
        const currentValue = this.getValue(gConfig);
        if (currentValue === value) {
            await this.handleDuplicate(interaction, this.name, value);
            return;
        }

        await gConfig.setSetting(this.internalName, value);
        await interaction.editOriginal(Util.replaceContent({
            content:    `**${this.name}** has been updated to \`${this.formatValue(value)}\`.`,
            components: new ComponentBuilder<MessageActionRow>(2)
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "settings", "open").with("setting", this.id).encode(),
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

    override async handlePick(interaction: ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: boolean | number) {
        value = Boolean(value);
        assert(this.validateInput(value), `failed to validate input for setting "${this.name}" (${String(value)})`);
        const currentValue = this.getValue(gConfig);
        await this.genericHandlePick<boolean>(interaction, this.name, currentValue, value, val => gConfig.setSetting(this.internalName, val));
    }

    override async open(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig) {
        const currentValue = this.getValue(gConfig);
        await interaction.editParent(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Server Settings: ${this.name}`)
                .setDescription(`Please select an option from below.\nCurrent Value: ${this.formatValue(this.getValue(gConfig))}`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(2)
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "settings", "menu").with("page", this.page).encode(),
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
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "settings", "pick").with("setting", this.id).with("value", 1).encode(),
                    disabled: currentValue,
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.shared.greenTick, "custom"),
                    label:    this.type === Type.YES_NO ? "Yes" : "Enabled",
                    style:    ButtonColors.GREEN
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "settings", "pick").with("setting", this.id).with("value", 0).encode(),
                    disabled: !currentValue,
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.shared.redTick, "custom"),
                    label:    this.type === Type.YES_NO ? "No" : "Disabled",
                    style:    ButtonColors.RED
                })
                .toJSON()
        }));
    }
}
