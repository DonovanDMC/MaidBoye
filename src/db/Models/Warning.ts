import { DataTypes } from "@uwu-codes/types";

export interface RawWarning {
	id: string;
	guild_id: string;
	user_id: string;
	blame_id: string;
	warning_id: number;
	created_at: bigint;
	reason: string | null;
}
export type WarningKV = DataTypes<Warning>;
export default class Warning {
	id: string;
	guildId: string;
	userId: string;
	blameId: string;
	warningId: number;
	createdAt: number;
	reason: string | null;
	constructor(data: RawWarning) {
		this.id = data.id;
		this.guildId = data.guild_id;
		this.userId = data.user_id;
		this.blameId = data.blame_id;
		this.warningId = data.warning_id;
		this.createdAt = Number(data.created_at);
		this.reason = data.reason;
	}
}
