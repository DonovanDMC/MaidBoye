import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type Eris from "eris";
import type MaidBoye from "@MaidBoye";
import db from "@db";
import type { RawTimedEntry } from "@db/Models/TimedEntry";
import TimedEntry from "@db/Models/TimedEntry";

export interface RawBanEntry extends RawGenericEntry {
	type: "ban";
	delete_days: number;
	timed_id: string;
}
export type BanEntryKV = DataTypes<BanEntry>;
export default class BanEntry extends GenericEntry {
	declare type: "ban";
	declare target: string;
	deleteDays: number;
	timedId: string | null;
	constructor(data: RawBanEntry, guild: GuildConfig) {
		super(data, guild);
		this.deleteDays = data.delete_days;
		this.timedId = data.timed_id;
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}

	async getTimedEntry(raw: true): Promise<RawTimedEntry>;
	async getTimedEntry(raw?: false): Promise<TimedEntry>;
	async getTimedEntry(raw = false) {
		if (this.timedId === null) return null;
		const [res] = await db.query("SELECT * FROM timed WHERE id=?", [this.timedId]) as Array<RawTimedEntry>;
		if (res === undefined) return null;
		if (raw) return res;
		else return new TimedEntry(res);
	}
}
