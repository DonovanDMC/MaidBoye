import type GuildConfig from "./GuildConfig";
import type { DataTypes } from "@uwu-codes/types";

export interface RawPrefix {
	id: string;
	guild_id: string;
	value: string;
	space: boolean;
}
export type PrefixKV = DataTypes<Prefix>;
export default class Prefix {
	private guild: GuildConfig;
	id: string;
	value: string;
	space: boolean;
	constructor(data: RawPrefix, guild: GuildConfig) {
		this.id = data.id;
		this.value = data.value;
		this.space = data.space;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}

	get delete() { return this.guild.removePrefix.bind(this.guild, this.id, "id"); }
}
