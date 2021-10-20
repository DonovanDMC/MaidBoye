import type { RawGenericEntry } from "./GenericEntry";
import GenericEntry from "./GenericEntry";
import type GuildConfig from "../GuildConfig";
import type { DataTypes } from "@uwu-codes/types";
import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export interface RawDeleteWarningEntry extends RawGenericEntry {
	type: "deletewarning";
	warning_id: number;
}
export type DeleteWarningEntryKV = DataTypes<DeleteWarningEntry>;
export default class DeleteWarningEntry extends GenericEntry {
	declare type: "deletewarning";
	declare target: string;
	warningId: number;
	constructor(data: RawDeleteWarningEntry, guild: GuildConfig) {
		super(data, guild);
		this.warningId = data.warning_id;
	}

	async getTarget(client: MaidBoye) {
		return super.getTarget.call(this, client) as Promise<Eris.User>;
	}
}
