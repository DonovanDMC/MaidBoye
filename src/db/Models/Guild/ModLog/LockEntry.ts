import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import Eris from "eris";
import MaidBoye from "@MaidBoye";

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
