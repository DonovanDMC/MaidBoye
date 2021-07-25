import SelfRoleJoined, { RawSelfRoleJoined } from "./SelfRoleJoined";
import db from "@db";
import Logger from "@util/Logger";
import { DataTypes, DeepPartial, Writeable } from "@uwu-codes/types";
import { OkPacket } from "@util/@types/MariaDB";
import crypto from "crypto";

export interface RawUserConfig {
	id: string;
}

export type UserConfigKV = DataTypes<UserConfig>;
export default class UserConfig {
	id: string;
	// @TODO remove roles from this array when they are manually removed
	// so they can't remove manually added roles
	selfRolesJoined: Array<SelfRoleJoined>;
	constructor(id: string, data: RawUserConfig, selfRolesJoinedData: Array<RawSelfRoleJoined>) {
		this.id = id;
		this.load(data, selfRolesJoinedData);
	}

	private load(data: RawUserConfig, selfRolesJoinedData: Array<RawSelfRoleJoined>) {
		this.id = data.id;
		this.selfRolesJoined = selfRolesJoinedData.map(d => new SelfRoleJoined(d, this));
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
		const v = {} as RawUserConfig;

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
			role,
			guild
		]);
		await this.reload();
		return id;
	}

	async removeSelfRoleJoined(value: string, column: "id" | "role") {
		const res = await db.query("DELETE FROM selfroles WHERE ?=? AND role=?", [column, value, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetSelfRoles(guild: string) {
		const res = await db.query("DELETE FROM selfroles user_id=? AND guild_id=?", [this.id, guild]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addStrike(guildId: string, blame: string) {
		const id = crypto.randomBytes(6).toString("hex");
		const res = await db.query("INSERT INTO strikes (id, guild_id, user_id, created_by, created_at) VALUES (?, ?, ?, ?, ?)", [id, guildId, this.id, blame, Date.now()]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return null;
		return id;
	}
}
