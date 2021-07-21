import GenericEntry, { RawGenericEntry } from "./GenericEntry";
import GuildConfig from "../GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawBanEntry extends RawGenericEntry {
	type: "ban";
	delete_days: number;
	timed_id: string;
}
export type BanEntryKV = DataTypes<BanEntry>;
export default class BanEntry extends GenericEntry {
	declare type: "ban";
	declare target: string;
	deleteDays: number;
	timedId: string | null;
	constructor(data: RawBanEntry, guild: GuildConfig) {
		super(data, guild);
		this.deleteDays = data.delete_days;
		this.timedId = data.timed_id;
	}
}
