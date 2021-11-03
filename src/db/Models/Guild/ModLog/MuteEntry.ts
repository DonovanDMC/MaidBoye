import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";
import type { RawTimedEntry } from "@models/TimedEntry";
import TimedEntry from "@models/TimedEntry";
import db from "@db";

export interface RawMuteEntry extends RawGenericEntry {
	type: "mute";
	timed_id: string;
}
export type MuteEntryKV = DataTypes<MuteEntry>;
export default class MuteEntry extends GenericEntry {
	declare type: "mute";
	declare target: string;
	timedId: string | null;
	constructor(data: RawMuteEntry, guild: GuildConfig) {
		super(data, guild);
		this.timedId = data.timed_id;
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget(client) as Promise<Eris.User>;
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
