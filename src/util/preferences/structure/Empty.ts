/* eslint-disable @typescript-eslint/no-unused-vars */
import BasePreference from "./BasePreference.js";
import type CommandOption from "../../cmd/CommandOption.js";
import type UserConfig from "../../../db/Models/UserConfig.js";
import NotImplementedError from "../../NotImplementedError.js";
import type { CommandInteraction, ComponentInteraction, SelectMenuComponentInteraction } from "../../cmd/Command.js";
import type { ApplicationCommandOptionTypes } from "oceanic.js";

// this is not a real preference, it's an empty preference for a generic import type
export default class EmptyPreference extends BasePreference {
    description: string;
    emoji: string | null;
    emojiType: "default" | "custom";
    interactionsOption: CommandOption<ApplicationCommandOptionTypes.SUB_COMMAND | ApplicationCommandOptionTypes.SUB_COMMAND_GROUP>;
    name: string;
    validValues: string;

    protected override validateInput(value: unknown): boolean {
        throw new NotImplementedError(`${this.constructor.name}#validateInput`);
    }

    override formatValue(value: unknown): string {
        throw new NotImplementedError(`${this.constructor.name}#formatValue`);
    }

    override async getValue(uConfig: UserConfig) {
        throw new NotImplementedError(`${this.constructor.name}#getValue`);
    }

    override async handleInteraction(interaction: CommandInteraction, uConfig: UserConfig, value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handleInteraction`);
    }

    override async handlePick(interaction: ComponentInteraction, uConfig: UserConfig, value: unknown) {
        throw new NotImplementedError(`${this.constructor.name}#handlePick`);
    }

    override async open(interaction: SelectMenuComponentInteraction, uConfig: UserConfig) {
        throw new NotImplementedError(`${this.constructor.name}#open`);
    }
}
