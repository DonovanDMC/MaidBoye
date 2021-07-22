import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

export interface RawClearWarningsEntry extends RawGenericEntry {
	type: "clearwarnings";
	total: number;
}
export type ClearWarningsEntryKV = DataTypes<ClearWarningsEntry>;
export default class ClearWarningsEntry extends GenericEntry {
	declare type: "clearwarnings";
	declare target: string;
	total: number;
	constructor(data: RawClearWarningsEntry, guild: GuildConfig) {
		super(data, guild);
		this.total = data.total;
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
