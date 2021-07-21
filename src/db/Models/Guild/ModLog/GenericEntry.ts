import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawGenericEntry {
	id: string;
	entry_id: number;
	guild_id: string;
	message_id: string | null;
	target: string | null;
	blame: string;
	reason: string | null;
	type:
	"ban" | "kick" | "lock" |
	"lockdown" | "mute" | "softban" |
	"unban" | "unlock" | "unlockdown" |
	"unmute" | "warn" | "deletewarning" |
	"clearwarnings";
	created_at: bigint;
	last_edited_at: bigint | null;
	last_edited_by: string | null;
}
export type GenericEntryKV = DataTypes<GenericEntry>;
export default class GenericEntry {
	protected guild: GuildConfig;
	/** internal use only */
	id: string;
	entryId: number;
	guildId: string;
	messageId: string | null;
	target: string | null;
	/** id or "automatic" */
	blame: string;
	reason: string | null;
	type:
	"ban" | "kick" | "lock" |
	"lockdown" | "mute" | "softban" |
	"unban" | "unlock" | "unlockdown" |
	"unmute" | "warn" | "deletewarning" |
	"clearwarnings";
	createdAt: number;
	lastEditedAt: number | null;
	lastEditedBy: string | null;
	constructor(data: RawGenericEntry, guild: GuildConfig) {
		this.id = data.id;
		this.entryId = data.entry_id;
		this.guildId = data.guild_id;
		this.messageId = data.message_id;
		this.target = data.target;
		this.blame = data.blame;
		this.reason = data.reason;
		this.type = data.type ;
		this.createdAt = Number(data.created_at);
		this.lastEditedAt = data.last_edited_at === null ? null : Number(data.last_edited_at);
		this.lastEditedBy = data.last_edited_by;
		this.guild = guild;
	}

	get delete() { return this.guild.removeModlog.bind(this.guild, this.id); }
	get edit() { return this.guild.editModlog.bind(this.guild); }
}
