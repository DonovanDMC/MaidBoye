import type {
    ApplicationCommandOptions,
    ApplicationCommandOptionsAttachment,
    ApplicationCommandOptionsBoolean,
    ApplicationCommandOptionsChannel,
    ApplicationCommandOptionsChoice,
    ApplicationCommandOptionsInteger,
    ApplicationCommandOptionsMentionable,
    ApplicationCommandOptionsNumber,
    ApplicationCommandOptionsRole,
    ApplicationCommandOptionsString,
    ApplicationCommandOptionsSubCommand,
    ApplicationCommandOptionsSubCommandGroup,
    ApplicationCommandOptionsUser,
    ApplicationCommandOptionsWithValue,
    ChannelTypes
} from "oceanic.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

type TypeToOption<T extends ApplicationCommandOptionTypes> =
    T extends ApplicationCommandOptionTypes.SUB_COMMAND ?
        ApplicationCommandOptionsSubCommand :
        T extends ApplicationCommandOptionTypes.SUB_COMMAND_GROUP ?
            ApplicationCommandOptionsSubCommandGroup :
            T extends ApplicationCommandOptionTypes.STRING ?
                ApplicationCommandOptionsString :
                T extends ApplicationCommandOptionTypes.INTEGER ?
                    ApplicationCommandOptionsInteger :
                    T extends ApplicationCommandOptionTypes.BOOLEAN ?
                        ApplicationCommandOptionsBoolean :
                        T extends ApplicationCommandOptionTypes.USER ?
                            ApplicationCommandOptionsUser :
                            T extends ApplicationCommandOptionTypes.CHANNEL ?
                                ApplicationCommandOptionsChannel :
                                T extends ApplicationCommandOptionTypes.ROLE ?
                                    ApplicationCommandOptionsRole :
                                    T extends ApplicationCommandOptionTypes.MENTIONABLE ?
                                        ApplicationCommandOptionsMentionable :
                                        T extends ApplicationCommandOptionTypes.NUMBER ?
                                            ApplicationCommandOptionsNumber :
                                            T extends ApplicationCommandOptionTypes.ATTACHMENT ?
                                                ApplicationCommandOptionsAttachment : never;

export default class CommandOption<T extends ApplicationCommandOptionTypes = ApplicationCommandOptionTypes, O extends ApplicationCommandOptions = TypeToOption<T>> {
    autocomplete?: boolean;
    channelTypes?: Array<ChannelTypes>;
    choices: Array<ApplicationCommandOptionsChoice> = [];
    description = "";
    max?: number;
    min?: number;
    name: string;
    options: Array<ApplicationCommandOptions> = [];
    parent?: CommandOption<T>;
    required?: boolean;
    type: T;
    constructor(type: T, name: string) {
        this.type = type;
        this.name = name;
    }

    addChoice(name: string, value: string) {
        this.choices.push({ name, value });
        return this;
    }

    addOption(option: CommandOption | ApplicationCommandOptions) {
        if (option instanceof CommandOption) option = option.finalizeOption();
        this.options.push(option);
        return this;
    }

    finalizeOption() {
        let res: ApplicationCommandOptions;
        switch (this.type) {
            case ApplicationCommandOptionTypes.SUB_COMMAND: {
                res = {
                    type:        this.type,
                    name:        this.name,
                    description: this.description,
                    options:     this.options as Array<ApplicationCommandOptionsWithValue>
                } as ApplicationCommandOptionsSubCommand;
                break;
            }

            case ApplicationCommandOptionTypes.SUB_COMMAND_GROUP: {
                res = {
                    type:        this.type,
                    name:        this.name,
                    description: this.description,
                    options:     this.options
                } as ApplicationCommandOptionsSubCommandGroup;
                break;
            }

            case ApplicationCommandOptionTypes.STRING: {
                res = {
                    type:         this.type,
                    name:         this.name,
                    description:  this.description,
                    autocomplete: this.autocomplete,
                    choices:      this.choices,
                    minLength:    this.min,
                    maxLength:    this.max,
                    required:     this.required
                } as ApplicationCommandOptionsString;
                break;
            }

            case ApplicationCommandOptionTypes.INTEGER:
            case ApplicationCommandOptionTypes.NUMBER: {
                res = {
                    type:        this.type,
                    name:        this.name,
                    description: this.description,
                    choices:     this.choices,
                    minValue:    this.min,
                    maxValue:    this.max,
                    required:    this.required
                } as ApplicationCommandOptionsInteger | ApplicationCommandOptionsNumber;
                break;
            }

            case ApplicationCommandOptionTypes.BOOLEAN:
            case ApplicationCommandOptionTypes.USER:
            case ApplicationCommandOptionTypes.ROLE:
            case ApplicationCommandOptionTypes.MENTIONABLE:
            case ApplicationCommandOptionTypes.ATTACHMENT: {
                res = {
                    type:        this.type,
                    name:        this.name,
                    description: this.description,
                    required:    this.required
                } as ApplicationCommandOptionsBoolean | ApplicationCommandOptionsUser | ApplicationCommandOptionsRole | ApplicationCommandOptionsMentionable | ApplicationCommandOptionsAttachment;
                break;
            }

            case ApplicationCommandOptionTypes.CHANNEL: {
                res = {
                    type:         this.type,
                    name:         this.name,
                    description:  this.description,
                    channelTypes: this.channelTypes,
                    required:     this.required
                } as ApplicationCommandOptionsChannel;
                break;
            }

            default: {
                return null as never;
            }
        }

        return res as O;
    }

    setAutocomplete(value = true) {
        this.autocomplete = value;
        return this;
    }

    setChannelTypes(types: Array<ChannelTypes>) {
        this.channelTypes = types;
        return this;
    }

    setChoices(choices: CommandOption<T>["choices"]) {
        this.choices = choices;
        return this;
    }

    setDescription(value: string) {
        this.description = value;
        return this;
    }

    setMinMax(min?: number, max?: number) {
        this.max = max;
        this.min = min;
        return this;
    }

    setRequired(value = true) {
        this.required = value;
        return this;
    }
}
