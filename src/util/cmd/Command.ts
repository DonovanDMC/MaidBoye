import CommandHandler from "./CommandHandler";
import MaidBoye from "../../main";
import ExtendedMessage from "../ExtendedMessage";
import { ArrayOneOrMore } from "@uwu-codes/types";
import Eris from "eris";

export type CommandRestrictions = "beta" | "developer" | "nsfw";
export type DeprecatedPermissions = "viewAuditLogs" | "stream" | "readMessages" | "externalEmojis";
export type FakePermissions = "allGuild" | "allText" | "allVoice" | "all";
export type Permissions = Exclude<keyof typeof Eris["Constants"]["Permissions"], DeprecatedPermissions | FakePermissions>;
export default class Command {
	triggers: ArrayOneOrMore<string>;
	restrictions = [] as Array<CommandRestrictions>;
	userPermissions = [] as Array<[perm: Permissions, optional: boolean]>;
	botPermissions = [] as Array<[perm: Permissions, optional: boolean]>;
	usage: ((this: MaidBoye, msg: ExtendedMessage, cmd: Command) => Eris.MessageContent | null | Promise<Eris.MessageContent | null>) = () => null;
	description = "";
	parsedFlags = [] as Array<string>;
	slashCommandOptions = [] as Array<Eris.SlashCommandOptions>;
	cooldown = 0;
	donatorCooldown = 0;
	hasSlashVariant: boolean | "lite" = false;
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

	setSlashOptions(hasSlash: boolean | "lite", options: Array<Eris.SlashCommandOptions>) {
		this.hasSlashVariant = hasSlash;
		this.slashCommandOptions = options;
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
