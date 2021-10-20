import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export interface RawUnBanEntry extends RawGenericEntry {
	type: "unban";
}
export type UnBanEntryKV = DataTypes<UnBanEntry>;
export default class UnBanEntry extends GenericEntry {
	declare type: "unban";
	declare target: string;
	constructor(data: RawUnBanEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
