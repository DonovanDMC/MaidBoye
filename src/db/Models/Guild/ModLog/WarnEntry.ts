import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";
import db from "@db";
import Warning from "@models/Warning";

export interface RawWarnEntry extends RawGenericEntry {
	type: "warn";
	active: 0 | 1;
	warning_id: number;
}
export type WarnEntryKV = DataTypes<WarnEntry>;
export default class WarnEntry extends GenericEntry {
	declare type: "warn";
	declare target: string;
	active: boolean;
	warningId: number;
	constructor(data: RawWarnEntry, guild: GuildConfig) {
		super(data, guild);
		this.active = Boolean(data.active);
		this.warningId = data.warning_id;
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}

	async getWarning() {
		// reporting an error that isn't happening here
		// eslint-disable-next-line
		return db.query("SELECT * FROM warnings WHERE warning_id=?", [this.warningId]).then(([res]) => new Warning(res));
	}
}
