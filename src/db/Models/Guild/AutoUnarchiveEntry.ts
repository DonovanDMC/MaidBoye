import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawAutoUnarchiveEntry {
	id: string;
	guild_id: string;
	thread_id: string;
}
export type AutoUnarchiveEntryKV = DataTypes<AutoUnarchiveEntry>;
export default class AutoUnarchiveEntry {
	private guild: GuildConfig;
	id: string;
	guildId: string;
	threadId: string;
	constructor(data: RawAutoUnarchiveEntry, guild: GuildConfig) {
		this.id = data.id;
		this.guildId = data.guild_id;
		this.threadId = data.thread_id;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
}
