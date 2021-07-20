import db from "..";
import config from "@config";
import BotFunctions from "@util/BotFunctions";
import { MatchKeysAndValues, UpdateFilter } from "mongodb";
import { Utility } from "@uwu-codes/utils";
import { DataTypes, Writeable } from "@uwu-codes/types";
import { Track } from "lavalink";
import { AutoArchiveDuration } from "eris";
import crypto from "crypto";

export interface UserReport {
	id: string;
	guildId: string;
	reportedBy: string;
	reportedUser: string;
	reportedAt: string;
	channel: string;
	channelType: "channel" | "thread";
	reason: string;
}
export interface UserReportExtra extends UserReport {
	edit(reason: string): Promise<UserReportExtra | null>;
	delete(): Promise<boolean>;
}

export type GuildConfigKV = DataTypes<GuildConfig>;
export default class GuildConfig {
	id: string;
	prefix: Array<{
		value: string;
		space: boolean;
	}>;
	tags: Array<{
		name: string;
		content: string;
		createdAt: string;
		createdBy: string;
		modifiedAt: string | null;
		modifiedBy: string | null;
	}>;
	queue: Array<{
		addedAt: string;
		addedBy: string;
		track: Track;
	}>;
	selfRoles: Array<{
		role: string;
		addedAt: string;
		addedby: string;
	}>;
	reports: {
		enabled: boolean;
		category: string | null;
		staffRole: string | null;
		threadsChannel: string | null;
		threadsExpiry: AutoArchiveDuration;
		type: "channel" | "threads";
	};
	modlog: {
		enabled: boolean;
		caseEditingEnabled: boolean;
		caseDeletingEnabled: boolean;
		editOthersCasesEnabled: boolean;
		webhook: Record<"id" | "token" | "channelId", string> | null;
	};
	settings: {
		defaultYiffType: typeof config["yiffTypes"][number] | null;
		yiffThumbnailType: "gif" | "image";
		muteRole: string | null;
	};
	constructor(id: string, data: GuildConfigKV) {
		this.id = id;
		this.load(data);
	}

	private load(data: GuildConfigKV) {
		Object.assign(this, Utility.mergeObjects(data, config.defaults.guild));
		return this;
	}

	async reload() {
		const v = await db.collection("guilds").findOne({ id: this.id });
		if (v === undefined) throw new Error(`Unexpected undefined on GuildConfig#reload (id: ${this.id})`);
		this.load(v);
		return this;
	}

	async edit(data: MatchKeysAndValues<GuildConfigKV>) {
		return this.mongoEdit({ $set: data });
	}

	async mongoEdit(data: UpdateFilter<GuildConfigKV>) {
		await db.collection("guilds").findOneAndUpdate({ id: this.id }, data);
		await this.reload();
		return this;
	}

	async fix() {
		// nothing to fix yet, so this is just blank
		const obj = {} as Writeable<MatchKeysAndValues<GuildConfigKV>>;

		if (JSON.stringify(obj) !== "{}") await this.edit(obj);
	}

	getFormattedPrefix(index = 0) {
		return BotFunctions.formatPrefix(this.prefix[index]);
	}

	async createReport(reportedBy: string, reportedUser: string, channel: string, channelType: UserReport["channelType"], reason: string) {
		const id = crypto.randomBytes(4).toString("hex");

		await db.collection("reports").insertOne({
			id,
			guildId: this.id,
			reportedBy,
			reportedUser,
			reportedAt: new Date().toISOString(),
			channel,
			channelType,
			reason
		});

		return id;
	}

	async getReport(id: string): Promise<UserReportExtra | null> {
		const r = await db.collection("reports").findOne({
			id,
			guildId: this.id
		});
		const self = this;

		return {
			...r,
			edit(reason: string) { return self.editReport(this.id, reason); },
			delete() { return self.deleteReport(this.id); }
		} as UserReportExtra;
	}

	async editReport(id: string, reason: string) {
		const r = await this.getReport(id);
		if (r === null) return null;
		await db.collection("reports").findOneAndUpdate({
			id,
			guildId: this.id
		}, {
			$set: {
				reason
			}
		});
		return this.getReport(id);
	}

	async deleteReport(id: string) {
		return db.collection("reports").findOneAndDelete({ id }).then(res => res.ok === 1);
	}
}
