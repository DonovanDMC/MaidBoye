import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export interface RawUnMuteEntry extends RawGenericEntry {
	type: "unmute";
}
export type UnMuteEntryKV = DataTypes<UnMuteEntry>;
export default class UnMuteEntry extends GenericEntry {
	declare type: "unmute";
	declare target: string;
	constructor(data: RawUnMuteEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
