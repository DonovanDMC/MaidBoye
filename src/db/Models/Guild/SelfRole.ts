import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawSelfRole {
	id: string;
	guild_id: string;
	role: string;
	added_at: bigint;
	added_by: string;
}
export type SelfRoleKV = DataTypes<SelfRole>;
export default class SelfRole {
	private guild: GuildConfig;
	id: string;
	role: string;
	addedAt: number;
	addedby: string;
	constructor(data: RawSelfRole, guild: GuildConfig) {
		this.id = data.id;
		this.role = data.role;
		this.addedAt = Number(data.added_at);
		this.addedby = data.added_by;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}

	get delete() { return this.guild.removeSelfRole.bind(this.guild, this.id, "id"); }
}
