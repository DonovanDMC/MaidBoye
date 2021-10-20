import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type Eris from "eris";
import type MaidBoye from "@MaidBoye";

export interface RawLockEntry extends RawGenericEntry {
	type: "lock";
}
export type LockEntryKV = DataTypes<LockEntry>;
export default class LockEntry extends GenericEntry {
	declare type: "lock";
	declare target: string;
	constructor(data: RawLockEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.GuildTextableChannelWithoutThreads>;
	}
}
