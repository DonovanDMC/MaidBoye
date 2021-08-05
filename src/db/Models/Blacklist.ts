import db from "..";
import { BooleanData } from "../../util/@types/MariaDB";
import { DataTypes } from "@uwu-codes/types";

export interface RawBlacklist {
	id: string;
	guild_id: string | null;
	user_id: string | null;
	type: 0 | 1;
	reason: string | null;
	notice_shown: BooleanData;
	expire_time: bigint;
	created_by: string;
	created_by_tag: string;
	created_at: bigint;
	report: string | null;
}
export interface RawGuildBlacklist extends RawBlacklist {
	type: 0;
	guild_id: string;
	user_id: null;
}
export interface RawUserBlacklist extends RawBlacklist {
	type: 1;
	guild_id: null;
	user_id: string;
}

export type BlacklistKV = DataTypes<Blacklist>;
export default class Blacklist {
	static GUILD = 0 as const;
	static USER = 1 as const;
	id: string;
	guildId: string | null;
	userId: string | null;
	type: "guild" | "user";
	reason: string | null;
	noticeShown: boolean;
	expireTime: number;
	createdBy: string;
	createdByTag: string;
	createdAt: number;
	report: string | null;
	constructor(data: RawBlacklist) {
		this.id = data.id;
		this.guildId = data.guild_id;
		this.userId = data.user_id;
		// this is stored as 0/1 as a space saver
		this.type = data.type === Blacklist.GUILD ? "guild" : "user";
		this.reason = data.reason;
		this.noticeShown = Boolean(data.notice_shown);
		this.expireTime = Number(data.expire_time);
		this.createdBy = data.created_by;
		this.createdByTag = data.created_by_tag;
		this.createdAt = Number(data.created_at);
		this.report = data.report;
	}
	async setNoticeShown(data: boolean) { this.noticeShown = data; return db.query("UPDATE blacklist SET notice_shown=? WHERE id=?", [data, this.id]); }
	async expireNow() { this.expireTime = Date.now(); return db.query("UPDATE blacklist SET expire_time=? WHERE id=?", [this.expireTime, this.id]); }
	get active() { return this.expireTime === 0 || this.expireTime > Date.now(); }
	get expired() { return !this.active; }
}
export class GuildBlacklist extends Blacklist {
	declare type: "guild";
	declare guildId: string;
	declare userId: null;
	constructor(data: RawGuildBlacklist) { super(data); }
}
export class UserBlacklist extends Blacklist {
	declare type: "user";
	declare guildId: null;
	declare userId: string;
	constructor(data: RawUserBlacklist) { super(data); }
}
