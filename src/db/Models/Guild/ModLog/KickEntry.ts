import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";
import MaidBoye from "@MaidBoye";
import Eris from "eris";

export interface RawKickEntry extends RawGenericEntry {
	type: "kick";
}
export type KickEntryKV = DataTypes<KickEntry>;
export default class KickEntry extends GenericEntry {
	declare type: "kick";
	declare target: string;
	constructor(data: RawKickEntry, guild: GuildConfig) {
		super(data, guild);
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
