import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export interface RawUnLockEntry extends RawGenericEntry {
	type: "unlock";
}
export type UnLockEntryKV = DataTypes<UnLockEntry>;
export default class UnLockEntry extends GenericEntry {
	declare type: "unlock";
	declare target: string;
	constructor(data: RawUnLockEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.GuildTextableChannelWithoutThreads>;
	}
}
