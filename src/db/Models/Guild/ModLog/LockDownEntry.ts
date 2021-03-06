import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";

export interface RawLockDownEntry extends RawGenericEntry {
	type: "lockdown";
}
export type LockDownEntryKV = DataTypes<LockDownEntry>;
export default class LockDownEntry extends GenericEntry {
	declare type: "lockdown";
	declare target: null;
	constructor(data: RawLockDownEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget() { return null; }
}
