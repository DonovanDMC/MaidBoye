import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export interface RawSoftBanEntry extends RawGenericEntry {
	type: "softban";
	delete_days: number;
}
export type SoftBanEntryKV = DataTypes<SoftBanEntry>;
export default class SoftBanEntry extends GenericEntry {
	declare type: "softban";
	declare target: string;
	deleteDays: number;
	constructor(data: RawSoftBanEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
