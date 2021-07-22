import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

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
