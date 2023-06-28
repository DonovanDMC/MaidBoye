import type CommandOption from "../../cmd/CommandOption.js";
import Preferences from "../index.js";
import type UserConfig from "../../../db/Models/UserConfig.js";
import { State } from "../../State.js";
import Util from "../../Util.js";
import { Colors } from "../../Constants.js";
import type { CommandInteraction, ComponentInteraction } from "../../cmd/Command.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { ApplicationCommandOptionTypes, GuildComponentSelectMenuInteraction, MessageActionRow, PrivateComponentSelectMenuInteraction } from "oceanic.js";
import assert from "node:assert";


export default abstract class BasePreference {
    id = -1;
    page = -1;
    abstract description: string;
    abstract emoji: string | null;
    abstract emojiType: "default" | "custom";
    abstract interactionsOption: CommandOption<ApplicationCommandOptionTypes.SUB_COMMAND | ApplicationCommandOptionTypes.SUB_COMMAND_GROUP>;
    abstract name: string;
    abstract validValues: string;
    protected abstract validateInput(value: unknown): boolean;
    abstract formatValue(value: unknown): string;
    abstract getValue(uConfig: UserConfig): unknown;
    abstract handleInteraction(interaction: CommandInteraction, uConfig: UserConfig, value: unknown): Promise<void>;
    abstract handlePick(interaction: ComponentInteraction, uConfig: UserConfig, value: unknown): Promise<void>;
    abstract open(interaction: GuildComponentSelectMenuInteraction | PrivateComponentSelectMenuInteraction, uConfig: UserConfig): Promise<void>;

    get interactionsName() {
        return this.name.toLowerCase().replaceAll(/\s/g, "-");
    }

    get shortDescription() {
        return this.description;
    }

    protected async genericHandlePick<T = unknown>(interaction: ComponentInteraction, name: string, currentValue: T | null, value: T, setValue: (val: T) => Promise<unknown>) {
        assert(this.validateInput(value), `failed to validate input for preference "${this.name}"`);
        if (currentValue === value) {
            await this.handleDuplicate(interaction, this.name, value);
            return;
        }

        await setValue(value);

        const set = Preferences.get(name);
        await interaction.editParent(Util.replaceContent({
            content:    `**${this.name}** has been updated to \`${set.formatValue(value)}\`.`,
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

    protected async handleDuplicate(interaction: ComponentInteraction | CommandInteraction, name: string, value: unknown) {
        const pref = Preferences.get(name);
        return ("editParent" in interaction ? interaction.editParent.bind(interaction) : interaction.editOriginal.bind(interaction))(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Preferences: ${name}`)
                .setDescription(`**${name}** is already set to ${pref.formatValue(value)}.`)
                .setColor(Colors.red)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
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
}
