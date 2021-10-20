import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";

export interface RawUnLockDownEntry extends RawGenericEntry {
	type: "unlockdown";
}
export type UnLockDownEntryKV = DataTypes<UnLockDownEntry>;
export default class UnLockDownEntry extends GenericEntry {
	declare type: "unlockdown";
	declare target: string;
	constructor(data: RawUnLockDownEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget() { return null; }
}
