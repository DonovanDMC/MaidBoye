import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

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
}
