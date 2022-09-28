import { ValidLocation } from "./Command.js";
import type { AckString, CommandInteraction, InteractionCommandRestrictions } from "./Command.js";
import type MaidBoye from "../../main.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import type { CreateMessageApplicationCommandOptions, CreateUserApplicationCommandOptions, PermissionName } from "oceanic.js";
import { ApplicationCommandTypes, Permissions } from "oceanic.js";

export type RunnerFunction<T extends  ApplicationCommandTypes.USER | ApplicationCommandTypes.MESSAGE, G extends boolean, U extends boolean, V extends ValidLocation> = (this: MaidBoye, interaction: CommandInteraction<V>, gConfig: G extends true ? GuildConfig : null, uConfig: U extends true ? UserConfig : null, cmd: OtherCommand<T>) => Promise<unknown>;
export type AcknowledgementFunction<T  extends ApplicationCommandTypes.USER | ApplicationCommandTypes.MESSAGE, G extends boolean, U extends boolean, V extends ValidLocation> = (this: MaidBoye, interaction: CommandInteraction<V>, ephemeralUser: boolean, cmd: OtherCommand<T, G, U, V>) => Promise<false | void | AckString>;

export default class OtherCommand<T extends ApplicationCommandTypes.USER | ApplicationCommandTypes.MESSAGE, G extends boolean = false, U extends boolean = false, V extends ValidLocation = ValidLocation> {
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
    restrictions = [] as Array<InteractionCommandRestrictions>;
    run: RunnerFunction<T, G, U, V>;
    type: T;
    userPermissions = [] as Array<[perm: PermissionName, optional: boolean]>;
    /** 0 - both, 1 - guild, 2 - dm */
    validLocation: V;
    constructor(type: T, file: string, name: string) {
        this.type = type;
        this.file = file;
        this.name = name;
    }
    ack: AcknowledgementFunction<T, G, U, V> | AckString = interaction => interaction.defer();

    setAck(data: AcknowledgementFunction<T, G, U, V> | "none" | "ephemeral") {
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
        const self = this as unknown as OtherCommand<T, L, U, V>;
        self.doGuildLookup = data;
        return self;
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
        const self = this as unknown as OtherCommand<T, G, L, V>;
        self.doUserLookup = data;
        return self;
    }

    setValidLocation<L extends ValidLocation>(data: L) {
        const self = this as unknown as OtherCommand<T, G, U, L>;
        self.validLocation = data;
        return self;
    }

    toJSON(): CreateUserApplicationCommandOptions | CreateMessageApplicationCommandOptions {
        return {
            defaultMemberPermissions: this.defaultMemberPermissions.reduce((a, b) => a | Permissions[b], 0n).toString(),
            dmPermission:             this.validLocation === ValidLocation.GUILD ? false : true,
            name:                     this.name,
            nameLocalizations:        {}, // @TODO name localizations
            type:                     this.type
        };
    }
}

export class UserCommand extends OtherCommand<ApplicationCommandTypes.USER> {
    constructor(file: string, name: string) {
        super(ApplicationCommandTypes.USER, file, name);
    }

    override toJSON() {
        return super.toJSON() as CreateUserApplicationCommandOptions;
    }
}

export class MessageCommand extends OtherCommand<ApplicationCommandTypes.MESSAGE> {
    constructor(file: string, name: string) {
        super(ApplicationCommandTypes.MESSAGE, file, name);
    }

    override toJSON() {
        return super.toJSON() as CreateMessageApplicationCommandOptions;
    }
}
