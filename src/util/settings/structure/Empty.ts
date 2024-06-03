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
    protected override validateInput(_value: unknown): boolean {
        throw new NotImplementedError(`${this.constructor.name}#validateInput`);
    }

    override formatValue(_value: unknown): string {
        throw new NotImplementedError(`${this.constructor.name}#formatValue`);
    }

    override getValue(_gConfig: GuildConfig): Promise<unknown> {
        throw new NotImplementedError(`${this.constructor.name}#getValue`);
    }

    override async handleInteraction(_interaction: CommandInteraction<ValidLocation.GUILD>, _gConfig: GuildConfig, _value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handleInteraction`);
    }

    override async handlePick(_interaction: ComponentInteraction<ValidLocation.GUILD>, _gConfig: GuildConfig, _value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handlePick`);
    }

    override async open(_interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, _gConfig: GuildConfig) {
        throw new NotImplementedError(`${this.constructor.name}#open`);
    }
}
