import SelfRoleJoined, { RawSelfRoleJoined } from "./SelfRoleJoined";
import Strike, { RawStrike, StrikeGroup } from "../Strike";
import { AnyRawEntry, BanEntry, ClearWarningsEntry, DeleteWarningEntry, KickEntry, LockDownEntry, LockEntry, MuteEntry, SoftBanEntry, UnBanEntry, UnLockDownEntry, UnLockEntry, UnMuteEntry, WarnEntry } from "../Guild/ModLog/All";
import GuildConfig from "../Guild/GuildConfig";
import Warning, { RawWarning } from "../Warning";
import db from "@db";
import Logger from "@util/Logger";
import { DataTypes, DeepPartial, Writeable } from "@uwu-codes/types";
import { CountResponse, OkPacket } from "@util/@types/MariaDB";
import crypto from "crypto";

export interface RawUserConfig {
	id: string;
	premium_kofi_email: string | null;
	premium_months: number;
	premium_subscription: boolean;
	premium_total: number;
	marriage: string | null;
}

export type UserConfigKV = DataTypes<UserConfig>;
export default class UserConfig {
	id: string;
	// @TODO remove roles from this array when they are manually removed
	// so they can't remove manually added roles
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
		await db.query("INSERT INTO selfrolesjoined (id, user_id, guild_id, role) VALUES (?, ?, ?, ?)", [
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
}
