/* eslint-disable @typescript-eslint/no-unused-vars */
import BaseSetting from "./BaseSetting.js";
import type GuildConfig from "../../../db/Models/GuildConfig.js";
import type { CommandInteraction, ComponentInteraction, SelectMenuComponentInteraction, ValidLocation } from "../../cmd/Command.js";
import type CommandOption from "../../cmd/CommandOption.js";
import NotImplementedError from "../../NotImplementedError.js";
import type { ApplicationCommandOptionTypes } from "oceanic.js";

// this is not a real setting, it's an empty setting for a generic import type
export default class EmptySetting extends BaseSetting {
    description: string;
    emoji: string | null;
    emojiType: "default" | "custom";
    interactionsOption: CommandOption<typeof ApplicationCommandOptionTypes.SUB_COMMAND | ApplicationCommandOptionTypes.SUB_COMMAND_GROUP>;
    name: string;
    validValues: string;
    protected override validateInput(value: unknown): boolean {
        throw new NotImplementedError(`${this.constructor.name}#validateInput`);
    }

    override formatValue(value: unknown): string {
        throw new NotImplementedError(`${this.constructor.name}#formatValue`);
    }

    override getValue(gConfig: GuildConfig): Promise<unknown> {
        throw new NotImplementedError(`${this.constructor.name}#getValue`);
    }

    override async handleInteraction(interaction: CommandInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handleInteraction`);
    }

    override async handlePick(interaction: ComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig, value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handlePick`);
    }

    override async open(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, gConfig: GuildConfig) {
        throw new NotImplementedError(`${this.constructor.name}#open`);
    }
}
