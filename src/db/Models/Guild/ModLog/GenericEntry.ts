import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";
import db from "@db";
import type { RawStrike } from "@models/Strike";
import Strike from "@models/Strike";

export interface RawGenericEntry {
	id: string;
	entry_id: number;
	guild_id: string;
	message_id: string | null;
	strike_id: string;
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
export default abstract class GenericEntry {
	protected guild: GuildConfig;
	/** internal use only */
	id: string;
	entryId: number;
	guildId: string;
	messageId: string | null;
	strikeId: string;
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
		this.strikeId = data.strike_id;
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
	get edit() { return this.guild.editModlog.bind(this.guild, this.entryId); }

	async getTarget(client: MaidBoye) {
		if (this.target === null) return null;
		if (["lock", "unlock"].includes(this.type)) return client.getChannel(this.target) as Eris.GuildTextableChannel;
		return client.getUser(this.target);
	}

	async getBlame(client: MaidBoye) {
		if (this.blame === "automatic") return "automatic";
		return client.getUser(this.blame);
	}

	async getGuildConfig() {
		return db.getGuild(this.guildId);
	}

	async getMessage(client: MaidBoye) {
		if (this.messageId === null) return null;
		const cnf = await this.getGuildConfig();
		if (cnf.modlog.enabled === false || !cnf.modlog.webhook?.channelId) return null;
		return (client.getMessage(cnf.modlog.webhook.channelId, this.messageId).catch(() => null)) as Promise<Eris.Message<Eris.GuildTextableChannel> | null>;
	}

	async getStrike() {
		const [res] = await db.query("SELECT * FROM strikes WHERE id=?", [this.strikeId]) as Array<RawStrike>;
		if (res === undefined) return null;
		return new Strike(res);
	}
}
