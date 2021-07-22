import UserConfig from "./UserConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawSelfRoleJoined {
	id: string;
	user_id: string;
	guild_id: string;
	role: string;
}
export type SelfRoleJoinedKV = DataTypes<SelfRoleJoined>;
export default class SelfRoleJoined {
	private user: UserConfig;
	id: string;
	guildId: string;
	role: string;
	constructor(data: RawSelfRoleJoined, user: UserConfig) {
		this.id = data.id;
		this.role = data.role;
		this.guildId = data.guild_id;
		this.user = user;
	}

	get delete() { return this.user.removeSelfRoleJoined.bind(this.user, this.id, "id"); }
}