import { DataTypes } from "@uwu-codes/types";

export interface RawStrike {
	id: string;
	guild_id: string;
	user_id: string;
	created_by: bigint;
	created_at: bigint;
}
export type StrikeKV = DataTypes<Strike>;
export default class Strike {
	id: string;
	guildId: string;
	userId: string;
	createdBy: number;
	createdAt: number;
	constructor(data: RawStrike) {
		this.id = data.id;
		this.guildId = data.guild_id;
		this.userId = data.user_id;
		this.createdBy = Number(data.created_by);
		this.createdAt = Number(data.created_at);
	}
}
