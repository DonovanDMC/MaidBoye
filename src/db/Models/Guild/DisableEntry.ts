import type GuildConfig from "./GuildConfig";
import type { BitData } from "@util/@types/MariaDB";
import BotFunctions from "@util/BotFunctions";
import type { DataTypes } from "@uwu-codes/types";

export interface RawDisableEntry {
	id: string;
	guild_id: string;
	type: BitData;
	value: string | null;
	filter_type: BitData;
	filter_value: string | null;
}
export type DisableEntryKV = DataTypes<DisableEntry>;
export default class DisableEntry {
	// type
	static ALL = 0b00 as const;
	static CATEGORY = 0b01 as const;
	static COMMAND = 0b10 as const;
	// filter_type
	static FILTER_SERVER = 0b00 as const;
	static FILTER_USER = 0b01 as const;
	static FILTER_ROLE = 0b10 as const;
	static FILTER_CHANNEL = 0b11 as const;
	private guild: GuildConfig;
	id: string;
	guildId: string;
	type: "all" | "category" | "command";
	value: string | null;
	filterType: "server" | "user" | "role" | "channel";
	filterValue: string | null;
	constructor(data: RawDisableEntry, guild: GuildConfig) {
		this.id = data.id;
		this.guildId = data.guild_id;
		const type = BotFunctions.parseBit(data.type);
		const filterType = BotFunctions.parseBit(data.filter_type);
		this.type = type === DisableEntry.ALL ? "all" : type === DisableEntry.CATEGORY ? "category" : type === DisableEntry.COMMAND ? "command" : "invalid" as "all";
		this.value = data.value;
		this.filterType = filterType === DisableEntry.FILTER_SERVER ? "server" : filterType === DisableEntry.FILTER_USER ? "user" : filterType === DisableEntry.FILTER_ROLE ? "role" : filterType === DisableEntry.FILTER_CHANNEL ? "channel" : "invalid" as "server";
		this.filterValue = data.filter_value;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
}
// this should be impossible
export interface AllServerDisableEntry extends DisableEntry {
	type: "all";
	value: null;
	filterType: "server";
	filterValue: null;
}
export interface AllUserDisableEntry extends DisableEntry {
	type: "all";
	value: null;
	filterType: "user";
	filterValue: string;
}
export type AllRoleDisableEntry = Omit<AllUserDisableEntry, "filterType"> & { filterType: "role"; };
export type AllChannelDisableEntry = Omit<AllUserDisableEntry, "filterType"> & { filterType: "channel"; };
export type AllAnyDisableEntry = AllServerDisableEntry | AllUserDisableEntry | AllRoleDisableEntry | AllChannelDisableEntry;

export interface CategoryServerDisableEntry extends DisableEntry {
	type: "category";
	value: string;
	filterType: "server";
	filterValue: null;
}
export interface CategoryUserDisableEntry extends DisableEntry {
	type: "category";
	value: string;
	filterType: "user";
	filterValue: string;
}
export type CategoryRoleDisableEntry = Omit<CategoryUserDisableEntry, "filterType"> & { filterType: "role"; };
export type CategoryChannelDisableEntry = Omit<CategoryUserDisableEntry, "filterType"> & { filterType: "channel"; };
export type CategoryAnyDisableEntry = CategoryServerDisableEntry | CategoryUserDisableEntry | CategoryRoleDisableEntry | CategoryChannelDisableEntry;

export interface CommandServerDisableEntry extends DisableEntry {
	type: "command";
	value: string;
	filterType: "server";
	filterValue: null;
}
export interface CommandUserDisableEntry extends DisableEntry {
	type: "command";
	value: string;
	filterType: "user";
	filterValue: string;
}
export type CommandRoleDisableEntry = Omit<CommandUserDisableEntry, "filterType"> & { filterType: "role"; };
export type CommandChannelDisableEntry = Omit<CommandUserDisableEntry, "filterType"> & { filterType: "channel"; };
export type CommandAnyDisableEntry = CommandServerDisableEntry | CommandUserDisableEntry | CommandRoleDisableEntry | CommandChannelDisableEntry;

export type AnyDisableEntry = AllAnyDisableEntry | CategoryAnyDisableEntry | CommandAnyDisableEntry;
