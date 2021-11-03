import CommandHandler from "./CommandHandler";
import type ExtendedMessage from "../ExtendedMessage";
import type MaidBoye from "@MaidBoye";
import type { ArrayOneOrMore } from "@uwu-codes/types";
import Eris from "eris";
import type { Permissions } from "@util/Constants";

export type CommandRestrictions = "beta" | "developer" | "nsfw";
export default class Command {
	triggers: ArrayOneOrMore<string>;
	restrictions = [] as Array<CommandRestrictions>;
	userPermissions = [] as Array<[perm: Permissions, optional: boolean]>;
	botPermissions = [] as Array<[perm: Permissions, optional: boolean]>;
	usage: ((this: MaidBoye, msg: ExtendedMessage, cmd: Command) => Eris.MessageContent | null | Promise<Eris.MessageContent | null>) = () => null;
	description = "";
	parsedFlags = [] as Array<string>;
	applicationCommands = [] as Array<Eris.ApplicationCommandStructure>;
	liteApplicationCommands = [] as Array<Eris.ApplicationCommandStructure>;
	cooldown = 0;
	donatorCooldown = 0;
	category: string;
	file: string;
	run: (this: MaidBoye, msg: ExtendedMessage, cmd: Command) => Promise<unknown>;
	constructor(first: string, ...other: Array<string>) {
		this.file = (/((?:[A-Z]:[\S\s]+|\\[\S\s]+)|(?:\/[\w-]+)+\..+)/.exec(new Error().stack!.split("\n")[2]) ?? [])[1]?.split(":")?.slice(0, -2)?.join(":");
		this.setTriggers(first, ...other);
	}

	setTriggers(first: string, ...other: Array<string>) {
		this.triggers = [first, ...other];
		return this;
	}

	setRestrictions(...data: Command["restrictions"]) {
		this.restrictions = data;
		return this;
	}

	setPermissions(type: "user" | "bot", ...data: Array<[perm: Permissions, optional?: boolean] | Permissions>) {
		this[`${type}Permissions` as const] = data.map(p => Array.isArray(p) ? [p[0], p[1] ?? false] : [p, false]);
		return this;
	}

	setUsage(data: string | null | Command["usage"]) {
		this.usage = typeof data !== "function" ? () => data : data;
		return this;
	}

	setDescription(data: string) {
		this.description = data;
		return this;
	}

	setParsedFlags(...data: Array<string>) {
		this.parsedFlags = data;
		return this;
	}

	addApplicationCommand(type: 1, options: Array<Eris.ApplicationCommandOptions>): this
	addApplicationCommand(type: 2 | 3, name: string): this
	addApplicationCommand(type: 1 | 2 | 3, nameOrOptions: Array<Eris.ApplicationCommandOptions> | string) {
		this.applicationCommands.push({
			name: type === Eris.Constants.ApplicationCommandTypes.CHAT_INPUT ? this.triggers[0] : String(nameOrOptions),
			description: type === Eris.Constants.ApplicationCommandTypes.CHAT_INPUT ? this.description : undefined as never,
			type,
			options: type === Eris.Constants.ApplicationCommandTypes.CHAT_INPUT ? Array.isArray(nameOrOptions) ? nameOrOptions : [] : [],
			defaultPermission: true
		});
		return this;
	}

	addLiteApplicationCommand(type: (typeof Eris["Constants"]["ApplicationCommandTypes"])[keyof typeof Eris["Constants"]["ApplicationCommandTypes"]], options: Array<Eris.ApplicationCommandOptions>) {
		this.liteApplicationCommands.push({
			name: this.triggers[0],
			description: this.description,
			type,
			options,
			defaultPermission: true
		});
		return this;
	}

	setExecutor(data: Command["run"]) {
		this.run = data;
		return this;
	}

	setCooldown(normal: number, donator = normal) {
		this.cooldown = normal;
		this.donatorCooldown = donator;
		return this;
	}

	register(cat: string, log = true) { return CommandHandler.registerCommand(cat, this, log); }
}
