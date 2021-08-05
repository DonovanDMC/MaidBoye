import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawLevelRole {
	id: string;
	guild_id: string;
	role: string;
	xp_required: number;
}
export type LevelRoleKV = DataTypes<LevelRole>;
export default class LevelRole {
	private guild: GuildConfig;
	id: string;
	guildId: string;
	role: string;
	xpRequired: number;
	constructor(data: RawLevelRole, guild: GuildConfig) {
		this.id = data.id;
		this.guildId = data.guild_id;
		this.role = data.role;
		this.xpRequired = data.xp_required;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
}
