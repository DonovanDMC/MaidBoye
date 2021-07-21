import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

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
}
