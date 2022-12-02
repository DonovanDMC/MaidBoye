import Settings from "../index.js";
import type GuildConfig from "../../../db/Models/GuildConfig.js";
import type { CommandInteraction, ComponentInteraction, ValidLocation } from "../../cmd/Command.js";
import type CommandOption from "../../cmd/CommandOption.js";
import { State } from "../../State.js";
import Util from "../../Util.js";
import { Colors } from "../../Constants.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { ApplicationCommandOptionTypes, MessageActionRow } from "oceanic.js";
import assert from "node:assert";

export default abstract class BaseSetting {
    id = -1;
    page = -1;
    abstract description: string;
    abstract emoji: string | null;
    abstract emojiType: "default" | "custom";
    abstract interactionsOption: CommandOption<typeof ApplicationCommandOptionTypes.SUB_COMMAND | ApplicationCommandOptionTypes.SUB_COMMAND_GROUP>;
    abstract name: string;
    abstract validValues: string;

    protected abstract validateInput(value: unknown): boolean;
    abstract formatValue(value: unknown): string;
    abstract getValue(gConfig: GuildConfig): unknown;
    abstract handleInteraction(interaction: CommandInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: unknown): Promise<void>;
    abstract handlePick(interaction: ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: unknown): Promise<void>;
    abstract open(interaction: ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig): Promise<void>;
    get interactionsName() {
        return this.name.toLowerCase().replace(/\s/g, "-");
    }
    get shortDescription() {
        return this.description;
    }
    protected async genericHandlePick<T = unknown>(interaction: ComponentInteraction<ValidLocation.GUILD>, name: string, currentValue: T | null, value: T, setValue: (val: T) => Promise<unknown>) {
        assert(this.validateInput(value), `failed to validate input for setting "${this.name}"`);
        if (currentValue === value) {
            await this.handleDuplicate(interaction, this.name, value);
            return;
        }

        await setValue(value);

        const set = Settings.get(name);
        await interaction.editParent(Util.replaceContent({
            content:    `**${this.name}** has been updated to \`${set.formatValue(value)}\`.`,
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

    protected async handleDuplicate(interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, name: string, value: unknown) {
        const set = Settings.get(name);
        return ("editParent" in interaction ? interaction.editParent.bind(interaction) : interaction.editOriginal.bind(interaction))(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Server Settings: ${name}`)
                .setDescription(`**${name}** is already set to ${set.formatValue(value)}.`)
                .setColor(Colors.red)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
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
}
