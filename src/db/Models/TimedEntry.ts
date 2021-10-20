import type { DataTypes } from "@uwu-codes/types";

export interface RawTimedEntry {
	id: string;
	type: "ban" | "mute";
	guild_id: string;
	user_id: string;
	time: bigint;
	expiry: bigint;
}
export type TimedEntryKV = DataTypes<TimedEntry>;
export default class TimedEntry {
	id: string;
	type: "ban" | "mute";
	guildId: string;
	userId: string;
	time: number;
	expiry: number;
	constructor(data: RawTimedEntry) {
		this.id = data.id;
		this.type = data.type;
		this.guildId = data.guild_id;
		this.userId = data.user_id;
		this.time = Number(data.time);
		this.expiry = Number(data.expiry);
	}
}
