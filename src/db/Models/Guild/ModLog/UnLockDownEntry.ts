import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

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
}
