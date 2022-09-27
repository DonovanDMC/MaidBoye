import CommandOption from "./CommandOption.js";
import type { MessageCommand, UserCommand } from "./OtherCommand.js";
import type MaidBoye from "../../main.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import type {
    ApplicationCommandOptions,
    CreateChatInputApplicationCommandOptions,
    GuildAutocompleteInteraction,
    GuildCommandInteraction,
    GuildComponentButtonInteraction,
    GuildComponentSelectMenuInteraction,
    GuildModalSubmitInteraction,
    PermissionName,
    PrivateAutocompleteInteraction,
    PrivateCommandInteraction,
    PrivateComponentButtonInteraction,
    PrivateComponentSelectMenuInteraction,
    PrivateModalSubmitInteraction
} from "oceanic.js";
import { Permissions, ApplicationCommandTypes } from "oceanic.js";

export interface CommandExport {
    default?: Command;
    messageCommand?: MessageCommand;
    userCommand?: UserCommand;
}

export enum ValidLocation {
    BOTH   = 0,
    GUILD  = 1,
    PIVATE = 2
}

export type AutocompleteInteraction<V extends ValidLocation = ValidLocation.BOTH> = V extends ValidLocation.BOTH ? GuildAutocompleteInteraction | PrivateAutocompleteInteraction : V extends ValidLocation.GUILD ? GuildAutocompleteInteraction : V extends ValidLocation.PIVATE ? PrivateAutocompleteInteraction : never;
export type CommandInteraction<V extends ValidLocation = ValidLocation.BOTH> = V extends ValidLocation.BOTH ? GuildCommandInteraction | PrivateCommandInteraction : V extends ValidLocation.GUILD ? GuildCommandInteraction : V extends ValidLocation.PIVATE ? PrivateCommandInteraction : never;
export type ComponentInteraction<V extends ValidLocation = ValidLocation.BOTH> = ButtonComponentInteraction<V> | SelectMenuComponentInteraction<V>;
export type ButtonComponentInteraction<V extends ValidLocation = ValidLocation.BOTH> = V extends ValidLocation.BOTH ? GuildComponentButtonInteraction | PrivateComponentButtonInteraction : V extends ValidLocation.GUILD ? GuildComponentButtonInteraction : V extends ValidLocation.PIVATE ? PrivateComponentButtonInteraction : never;
export type SelectMenuComponentInteraction<V extends ValidLocation = ValidLocation.BOTH> = V extends ValidLocation.BOTH ? GuildComponentSelectMenuInteraction | PrivateComponentSelectMenuInteraction : V extends ValidLocation.GUILD ? GuildComponentSelectMenuInteraction : V extends ValidLocation.PIVATE ? PrivateComponentSelectMenuInteraction : never;
export type ModalSubmitInteraction<V extends ValidLocation = ValidLocation.BOTH> = V extends ValidLocation.BOTH ? GuildModalSubmitInteraction | PrivateModalSubmitInteraction : V extends ValidLocation.GUILD ? GuildModalSubmitInteraction : V extends ValidLocation.PIVATE ? PrivateModalSubmitInteraction : never;
export type AckString = "none" | "ephemeral" | "ephemeral-user" | "command-images-check";
export type RunnerFunction<T extends Record<string, unknown>, G extends boolean, U extends boolean, V extends ValidLocation> = (this: MaidBoye, interaction: CommandInteraction<V>, options: T, gConfig: G extends true ? GuildConfig : null, uConfig: U extends true ? UserConfig : null, cmd: Command<T>) => Promise<unknown>;
export type AcknowledgementFunction<T extends Record<string, unknown>, G extends boolean, U extends boolean, V extends ValidLocation> = (this: MaidBoye, interaction: CommandInteraction<V>, options: T, ephemeralUser: boolean, cmd: Command<T, G, U, V>) => Promise<false | void | AckString>;
export type ParseOptionsFunction<T extends Record<string, unknown>, G extends boolean, U extends boolean, V extends ValidLocation, R extends Record<string, unknown> = Record<string, unknown>> = (this: MaidBoye, interaction: CommandInteraction<V>, cmd: Command<T, G, U, V>) => Promise<R> | R;
export type InteractionCommandRestrictions = "beta" | "nsfw";
export type AnyCommand = Command | UserCommand | MessageCommand;

export default class Command<T extends Record<string, unknown> = Record<string, never>, G extends boolean = false, U extends boolean = false, V extends ValidLocation = ValidLocation> {
    static Option = CommandOption;
    botPermissions = [] as Array<[perm: PermissionName, optional: boolean]>;
    category: string;
    cooldown = 0;
    defaultMemberPermissions: Array<PermissionName> = [];
    description = "";
    doGuildLookup: G;
    doUserLookup: U;
    donatorCooldown = 0;
    file: string;
    name: string;
    options: Array<ApplicationCommandOptions> = [];
    // dynamically retrieved options (settings/preferences, etc)
    optionsGetter?: () => Array<ApplicationCommandOptions>;
    restrictions = [] as Array<InteractionCommandRestrictions>;
    run: RunnerFunction<T, G, U, V>;
    userPermissions = [] as Array<[perm: PermissionName, optional: boolean]>;
    /** 0 - both, 1 - guild, 2 - private */
    validLocation: V = ValidLocation.BOTH as V;
    constructor(file: string, name: string) {
        this.file = new URL("", file).pathname;
        this.name = name;
    }
    ack: AcknowledgementFunction<T, G, U, V> | AckString = interaction => interaction.defer();

    addOption(option: CommandOption | ApplicationCommandOptions) {
        if (option instanceof CommandOption) option = option.finalizeOption();
        this.options.push(option);
        return this;
    }

    addOptions(options: Array<ApplicationCommandOptions>) {
        options.map(o => this.addOption(o));
        return this;
    }

    parseOptions: ParseOptionsFunction<T, G, U, V> = () => ({});

    setAck(data: AcknowledgementFunction<T, G, U, V> | AckString) {
        this.ack = data;
        return this;
    }

    setCooldown(normal: number, donator = normal) {
        this.cooldown = normal;
        this.donatorCooldown = donator;
        return this;
    }

    setDefaultMemberPermissions(...permissions: Array<PermissionName>) {
        this.defaultMemberPermissions = permissions;
        return this;
    }

    setDescription(data: string) {
        this.description = data;
        return this;
    }

    setExecutor(data: RunnerFunction<T, G, U, V>) {
        this.run = data;
        return this;
    }

    setGuildLookup<L extends boolean>(data: L) {
        const self = this as unknown as Command<T, L, U, V>;
        self.doGuildLookup = data;
        return self;
    }

    setOptionsGetter(get: () => Array<ApplicationCommandOptions>) {
        this.optionsGetter = get;
        return this;
    }

    setOptionsParser<P extends ParseOptionsFunction<T, G, U, V>>(data: P) {
        this.parseOptions = data;
        return this as unknown as Command<Awaited<ReturnType<P>>, G, U, V>;
    }

    setPermissions(type: "user" | "bot", ...data: Array<[perm: PermissionName, optional?: boolean] | PermissionName>) {
        this[`${type}Permissions` as const] = data.map(p => Array.isArray(p) ? [p[0], p[1] ?? false] : [p, false]);
        return this;
    }

    setRestrictions(...data: Array<InteractionCommandRestrictions>) {
        this.restrictions = data;
        return this;
    }

    setUserLookup<L extends boolean>(data: L) {
        const self = this as unknown as Command<T, G, L, V>;
        self.doUserLookup = data;
        return self;
    }

    setValidLocation<L extends ValidLocation>(data: L) {
        const self = this as unknown as Command<T, G, U, L>;
        self.validLocation = data;
        return self;
    }

    toJSON(): CreateChatInputApplicationCommandOptions {
        const options: Array<ApplicationCommandOptions> = [];
        if (this.options.length) options.push(...this.options);
        if (this.optionsGetter) options.push(...this.optionsGetter());
        return {
            defaultMemberPermissions: this.defaultMemberPermissions.reduce((a, b) => a | Permissions[b], 0n).toString(),
            description:              this.description,
            descriptionLocalizations: {}, // @TODO description localizations
            dmPermission:             this.validLocation === ValidLocation.GUILD ? false : true,
            name:                     this.name,
            nameLocalizations:        {}, // @TODO name localizations
            options,
            type:                     ApplicationCommandTypes.CHAT_INPUT
        };
    }
}
