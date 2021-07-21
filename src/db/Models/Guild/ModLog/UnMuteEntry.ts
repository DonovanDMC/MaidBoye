import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

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
}
