import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawDisableEntry {
	id: string;
	guild_id: string;
	// mariadb BIT sucks
	type: Buffer | [number] | ReturnType<Buffer["toJSON"]>;
	value: string | null;
	channel: string | null;
}
export type DisableEntryKV = DataTypes<DisableEntry>;
export default class DisableEntry {
	static ALL = 0b00 as const;
	static CATEGORY = 0b01 as const;
	static COMMAND = 0b10 as const;
	private guild: GuildConfig;
	id: string;
	guildId: string;
	type: "all" | "category" | "command";
	value: string | null;
	channel: string | null;
	constructor(data: RawDisableEntry, guild: GuildConfig) {
		this.id = data.id;
		this.guildId = data.guild_id;
		const type =
			// @ts-ignore -- fuck off already
			Object.keys(data.type).includes(0) ? Number(data.type[0]) :
				"toJSON" in data.type ? data.type.toJSON().data[0] :
					"data" in data.type ? data.type.data[0] :
						-1;
		this.type = type === DisableEntry.ALL ? "all" : type === DisableEntry.CATEGORY ? "category" : type === DisableEntry.COMMAND ? "command" : "invalid" as "all";
		this.value = data.value;
		this.channel = data.channel;
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
}
