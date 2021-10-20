import type UserConfig from "./UserConfig";
import type { DataTypes } from "@uwu-codes/types";

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
		Object.defineProperty(this, "user", {
			value: user,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}

	get delete() { return this.user.removeSelfRoleJoined.bind(this.user, this.id, "id"); }
}
