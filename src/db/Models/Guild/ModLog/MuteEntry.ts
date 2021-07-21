import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawMuteEntry extends RawGenericEntry {
	type: "mute";
	timed_id: string;
}
export type MuteEntryKV = DataTypes<MuteEntry>;
export default class MuteEntry extends GenericEntry {
	declare type: "mute";
	declare target: string;
	timedId: string | null;
	constructor(data: RawMuteEntry, guild: GuildConfig) {
		super(data, guild);
		this.timedId = data.timed_id;
	}
}
