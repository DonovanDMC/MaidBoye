import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

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
