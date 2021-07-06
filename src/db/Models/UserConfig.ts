import db from "..";
import config from "../../config";
import Logger from "../../util/Logger";
import { DataTypes, Writeable } from "@uwu-codes/types";
import { Utility } from "@uwu-codes/utils";
import { MatchKeysAndValues, UpdateQuery } from "mongodb";

export type UserConfigKV = DataTypes<UserConfig>;
export default class UserConfig {
	id: string;
	// @TODO remove roles from this array when they are manually removed
	// so they can't remove manually added roles
	selfRolesJoined: Array<{
		role: string;
		guild: string;
	}>;
	constructor(id: string, data: UserConfigKV) {
		this.id = id;
		this.load(data);
	}

	private load(data: UserConfigKV) {
		Object.assign(this, Utility.mergeObjects(data, config.defaults.user));
		return this;
	}

	async reload() {
		const v = await db.collection("users").findOne({ id: this.id });
		if (v === null) throw new Error(`Unexpected null on UserConfig#reload (id: ${this.id})`);
		this.load(v);
		return this;
	}

	async edit(data: MatchKeysAndValues<UserConfigKV>) {
		return this.mongoEdit({ $set: data });
	}

	async mongoEdit(data: UpdateQuery<UserConfigKV>) {
		await db.collection("users").findOneAndUpdate({ id: this.id }, data);
		await this.reload();
		return this;
	}

	async fix() {
		const obj = {} as Writeable<MatchKeysAndValues<UserConfigKV>>;
		const dup = [...new Set(this.selfRolesJoined.map(s => JSON.stringify(s)))].map(s => JSON.parse(s) as UserConfig["selfRolesJoined"][number]);
		if (this.selfRolesJoined.length !== dup.length) obj.selfRolesJoined = dup;
		if (JSON.stringify(obj) !== "{}") {
			Logger.getLogger("UserConfig").warn(`Fixing user entry "${this.id}",`, JSON.stringify(obj));
			await this.edit(obj);
		}
	}
}
