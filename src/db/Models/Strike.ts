import { DataTypes } from "@uwu-codes/types";

export interface RawStrike {
	id: string;
	group_id: string;
	guild_id: string;
	user_id: string;
	created_by: string;
	created_at: bigint;
}
export type StrikeKV = DataTypes<Strike>;
export default class Strike {
	id: string;
	groupId: string;
	guildId: string;
	userId: string;
	createdBy: string;
	createdAt: number;
	constructor(data: RawStrike) {
		this.id = data.id;
		this.groupId = data.group_id;
		this.guildId = data.guild_id;
		this.userId = data.user_id;
		this.createdBy = data.created_by;
		this.createdAt = Number(data.created_at);
	}
}

export class StrikeGroup {
	id: string;
	strikes: Array<Strike>;
	constructor(id: string, strikes: Array<Strike>) {
		this.id = id;
		this.strikes = strikes;
	}

	get total() { return this.strikes.length; }
}
