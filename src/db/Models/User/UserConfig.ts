import type { RawSelfRoleJoined } from "./SelfRoleJoined";
import SelfRoleJoined from "./SelfRoleJoined";
import type { RawStrike } from "../Strike";
import Strike, { StrikeGroup } from "../Strike";
import type { AnyRawEntry } from "../Guild/ModLog/All";
import {
	BanEntry,
	ClearWarningsEntry,
	DeleteWarningEntry,
	KickEntry,
	LockDownEntry,
	LockEntry,
	MuteEntry,
	SoftBanEntry,
	UnBanEntry,
	UnLockDownEntry,
	UnLockEntry,
	UnMuteEntry,
	WarnEntry
} from "../Guild/ModLog/All";
import type GuildConfig from "../Guild/GuildConfig";
import type { RawWarning } from "../Warning";
import Warning from "../Warning";
import WebhookStore from "../../../util/WebhookStore";
import EmbedBuilder from "../../../util/EmbedBuilder";
import BotFunctions from "../../../util/BotFunctions";
import type { RawUserBlacklist } from "../Blacklist";
import Blacklist, { UserBlacklist } from "../Blacklist";
import db from "@db";
import Logger from "@util/Logger";
import type { DataTypes, DeepPartial, Writeable } from "@uwu-codes/types";
import type { CountResponse, OkPacket } from "@util/@types/MariaDB";
import { StringLiteralLike } from "typescript";
import crypto from "crypto";

export interface RawUserConfig {
	id: string;
	premium_kofi_email: string | null;
	premium_months: number;
	premium_subscription: boolean;
	premium_total: number;
	marriage: string | null;
}

export interface RawLevel {
	id: string;
	guild_id: string;
	user_id: string;
	xp: number;
}

export type UserConfigKV = DataTypes<UserConfig>;
export default class UserConfig {
	id: string;
	// @TODO remove roles from this array when they are manually removed\
	selfRolesJoined: Array<SelfRoleJoined>;
	donations: {
		kofiEmail: string | null;
		months: number;
		subscription: boolean;
		total: number;
	};
	// no plan for polyamorous relationships
	marriage: string | null;
	constructor(id: string, data: RawUserConfig, selfRolesJoinedData: Array<RawSelfRoleJoined>) {
		this.id = id;
		this.load(data, selfRolesJoinedData);
	}

	private load(data: RawUserConfig, selfRolesJoinedData: Array<RawSelfRoleJoined>) {
		this.id = data.id;
		this.selfRolesJoined = selfRolesJoinedData.map(d => new SelfRoleJoined(d, this));
		this.donations = {
			kofiEmail: data.premium_kofi_email,
			months: data.premium_months,
			subscription: data.premium_subscription,
			total: data.premium_total
		};
		this.marriage = data.marriage;
		return this;
	}

	async reload() {
		const v = await db.getUser(this.id, true, true);
		if (v === undefined) throw new Error(`Unexpected undefined on UserConfig#reload (id: ${this.id})`);
		this.load(v.user, v.selfRolesJoined);
		return this;
	}

	async edit(data: DeepPartial<UserConfigKV>) {
		if (data.selfRolesJoined) throw new TypeError("Field 'selfRolesJoined' cannot be used in the generic edit function.");
		const v = {
			premium_kofi_email: data.donations?.kofiEmail,
			premium_months: data.donations?.months,
			premium_subscription: data.donations?.subscription,
			premium_total: data.donations?.total,
			marriage: data.marriage
		} as RawUserConfig;

		const keys = Object.keys(v).filter(k => v[k as keyof typeof v] !== undefined);
		const values = Object.values(v).filter(Boolean) as Array<unknown>;
		await db.query(`UPDATE users SET ${keys.map(j => `${j}=?`).join(", ")} WHERE id = ?`, [...values, this.id]);
		return this.reload();
	}

	async fix() {
		const obj = {} as Writeable<UserConfigKV>;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- it does?
		const dup = [...new Set(this.selfRolesJoined.map(s => JSON.stringify(s)))].map(s => JSON.parse(s) as UserConfig["selfRolesJoined"][number]);
		if (this.selfRolesJoined.length !== dup.length) obj.selfRolesJoined = dup;
		if (JSON.stringify(obj) !== "{}") {
			Logger.getLogger("UserConfig").warn(`Fixing user entry "${this.id}",`, JSON.stringify(obj));
			await this.edit(obj);
		}
	}

	async addSelfRoleJoined(role: string, guild: string) {
		const id = crypto.randomBytes(6).toString("hex");
		// we would never see duplicates but I'm not getting into events yet
		// (to remove entries on manual role removal)
		await db.query("REPLACE INTO selfrolesjoined (id, user_id, guild_id, role) VALUES (?, ?, ?, ?)", [
			id,
			this.id,
			guild,
			role
		]);
		await this.reload();
		return id;
	}

	async removeSelfRoleJoined(guild: string, value: string, column: "id" | "role") {
		const res = await db.query(`DELETE FROM selfrolesjoined WHERE ${column}=? AND user_id=? AND guild_id=?`, [value, this.id, guild]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetSelfRolesJoined(guild: string) {
		const res = await db.query("DELETE FROM selfrolesjoined user_id=? AND guild_id=?", [this.id, guild]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addStrike(guildId: string, blame: string) {
		return UserConfig.prototype.addStrikes.call(this, guildId, blame, 1);
	}

	async addStrikes(guildId: string, blame: string, amount: number) {
		const d = Date.now();
		const groupId = crypto.randomBytes(6).toString("hex");
		const ids = [] as Array<string>;
		await db.pool.batch("INSERT INTO strikes (id, group_id, guild_id, user_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)", new Array(amount).fill(null).map(() => [
			ids[ids.push(crypto.randomBytes(6).toString("hex")) - 1],
			groupId,
			guildId,
			this.id,
			blame,
			d
		]));

		return ids;
	}

	async getStrikeCount(guild?: string) {
		return db.query(`SELECT COUNT(*) FROM strikes WHERE user_id="${this.id}"${guild === undefined ? "" : ` AND guild_id="${guild}"`}`).then((v: CountResponse) => (Number(v[0]["COUNT(*)"] ?? 0)));
	}

	async getStrikes(guild: string | undefined, group: true): Promise<Array<StrikeGroup>>;
	async getStrikes(guild?: string, group?: false): Promise<Array<Strike>>;
	async getStrikes(guild?: string, group = false) {
		const res = await db.query(`SELECT * FROM strikes WHERE user_id=?${guild === undefined ? "" : " AND guild_id=?"}`, [this.id, guild]) as Array<RawStrike>;
		if (group === true) {
			const val = new Map<string, Array<Strike>>();
			for (const rawStrike of res) {
				const strike = new Strike(rawStrike);
				if (val.has(strike.groupId)) val.set(strike.groupId, [...val.get(strike.groupId)!, strike]);
				else val.set(strike.groupId, [strike]);
			}

			return Array.from(val.entries()).map(([k, v]) => new StrikeGroup(k, v));
		} else return res.map(s => new Strike(s));
	}

	async getModlogEntries(guild: GuildConfig) {
		const res = await db.query("SELECT * FROM modlog WHERE guild_id=? AND target=?", [guild.id, this.id]).then(v => (v as Array<AnyRawEntry>));
		return res.map(v => {
			switch (v.type) {
				case "ban": return new BanEntry(v, guild);
				case "clearwarnings": return new ClearWarningsEntry(v, guild);
				case "deletewarning": return new DeleteWarningEntry(v, guild);
				case "kick": return new KickEntry(v, guild);
				case "lockdown": return new LockDownEntry(v, guild);
				case "lock": return new LockEntry(v, guild);
				case "mute": return new MuteEntry(v, guild);
				case "softban": return new SoftBanEntry(v, guild);
				case "unban": return new UnBanEntry(v, guild);
				case "unlockdown": return new UnLockDownEntry(v, guild);
				case "unlock": return new UnLockEntry(v, guild);
				case "unmute": return new UnMuteEntry(v, guild);
				case "warn": return new WarnEntry(v, guild);
			}
		});
	}

	async getWarnings(guild?: string) {
		return  db.query(`SELECT * FROM warnings WHERE user_id=?${guild === undefined ? "" : " AND guild_id=?"}`, [this.id, guild]).then((res: Array<RawWarning>) => res.map(w => new Warning(w)));
	}

	async getWarningCount(guild?: string) {
		return db.query(`SELECT COUNT(*) FROM warnings WHERE user_id=?${guild === undefined ? "" : " AND guild_id=?"}`, [this.id, guild]).then((v: CountResponse) => Number(v[0]["COUNT(*)"] ?? 0));
	}

	async addWarning(guild: string, blame: string, reason: string | null) {
		const id = crypto.randomBytes(6).toString("hex");
		const warningId = await UserConfig.prototype.getWarningCount.call(this, guild);
		await db.pool.query("INSERT INTO warnings (id, guild_id, user_id, blame_id, warning_id, created_at, reason) VALUES (?, ?, ?, ?, ?, ?, ?)", [
			id,
			guild,
			this.id,
			blame,
			warningId + 1,
			Date.now(),
			reason
		]);

		return warningId + 1;
	}

	async checkBlacklist() {
		const res = await db.query("SELECT * FROM blacklist WHERE type=? AND user_id=?", [Blacklist.USER, this.id]).then((r: Array<RawUserBlacklist>) => r.map(b => new UserBlacklist(b)));
		return {
			active: res.filter(b => b.active),
			expired: res.filter(b => b.expired),
			noticeShown: {
				active: res.filter(b => b.active && b.noticeShown),
				expired: res.filter(b => b.expired && b.noticeShown)
			},
			noticeNotShown: {
				active: res.filter(b => b.active && !b.noticeShown),
				expired: res.filter(b => b.expired && !b.noticeShown)
			}
		};
	}

	async addBlacklist(createdBy: string, createdByTag: string, reason: string | null, expiry: number, report: string | null) {
		await db.createGuildIfNotExists(this.id); // prototype calls
		const d = Date.now();
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO blacklist (id, guild_id, type, reason, expire_time, created_by, created_by_tag, created_at, report) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
			id,
			this.id,
			Blacklist.USER,
			reason,
			expiry ?? 0,
			createdBy,
			createdByTag,
			d,
			report
		]);
		await WebhookStore.execute("blacklist", {
			embeds: [
				new EmbedBuilder()
					.setTitle("New User Blacklist")
					.setDescription([
						`Guild: ${WebhookStore.client.users.get(this.id)?.tag ?? "Unknown"} (${this.id})`,
						`Reason: ${reason ?? "None Provided."}`,
						`Expiry: ${expiry === 0 ? "Never" : BotFunctions.formatDiscordTime(expiry, "short-datetime", true)}`,
						`Created By: ${createdByTag} (${createdBy})`
					].join("\n"))
					.toJSON()
			]
		});
		const [res] = await db.query("SELECT * FROM blacklist WHERE type=? AND user_id=? AND id=? LIMIT 1", [Blacklist.USER, this.id, id]).then((r: Array<RawUserBlacklist>) => r.map(b => new UserBlacklist(b)));
		return res;
	}

	async getExp(guild: string) {
		const res = await db.query("SELECT * FROM levels WHERE user_id=? AND guild_id=?", [
			this.id,
			guild
		]) as Array<RawLevel>;
		if (res.length === 0) {
			const id = crypto.randomBytes(6).toString("hex");
			await db.query("INSERT INTO levels (id, guild_id, user_id, xp) VALUES (?, ?, ?, ?)", [id, guild, this.id, 0]);
			return 0;
		}
		return res[0].xp;
	}

	async setExp(guild: string, amount: number) {
		return db.query("UPDATE levels SET xp=? WHERE user_id=? AND guild_id=?", [amount, this.id, guild]).then((r: OkPacket) => r.affectedRows > 0);
	}

	async addExp(guild: string, amount: number) {
		const xp = await this.getExp(guild);
		return UserConfig.prototype.setExp.call(this, guild, xp + amount);
	}
}
