import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

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
