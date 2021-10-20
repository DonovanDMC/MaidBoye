import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

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
