import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

export interface RawSoftBanEntry extends RawGenericEntry {
	type: "softban";
}
export type SoftBanEntryKV = DataTypes<SoftBanEntry>;
export default class SoftBanEntry extends GenericEntry {
	declare type: "softban";
	declare target: string;
	constructor(data: RawSoftBanEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
