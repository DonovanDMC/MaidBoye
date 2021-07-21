import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawTag {
	id: string;
	guild_id: string;
	name: string;
	content: string;
	created_at: bigint;
	created_by: string;
	modified_at: bigint | null;
	modified_by: string | null;
}
export type TagKV = DataTypes<Tag>;
export default class Tag {
	private guild: GuildConfig;
	id: string;
	name: string;
	content: string;
	createdAt: number;
	createdBy: string;
	modifiedAt: number | null;
	modifiedBy: string | null;
	constructor(data: RawTag, guild: GuildConfig) {
		this.id = data.id;
		this.name = data.name;
		this.content = data.content;
		this.createdAt = Number(data.created_at);
		this.createdBy = data.created_by;
		this.modifiedAt = data.modified_at === null ? null : Number(data.modified_at);
		this.modifiedBy = data.modified_by;
		this.guild = guild;
	}

	get edit() { return this.guild.editTag.bind(this.guild); }
}
