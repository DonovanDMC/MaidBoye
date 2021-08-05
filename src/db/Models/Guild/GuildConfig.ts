import SelfRole, { RawSelfRole } from "./SelfRole";
import Prefix, { RawPrefix } from "./Prefix";
import Tag, { RawTag, TagKV } from "./Tag";
import {
	AnyRawEntry,
	BanEntry, ClearWarningsEntry, DeleteWarningEntry,
	KickEntry, LockDownEntry, LockEntry,
	MuteEntry, SoftBanEntry, UnBanEntry,
	UnLockDownEntry, UnLockEntry, UnMuteEntry,
	WarnEntry
} from "./ModLog/All";
import LogEvent, { RawLogEvent } from "./LogEvent";
import DisableEntry, { AnyDisableEntry, RawDisableEntry } from "./DisableEntry";
import LevelRole, { RawLevelRole } from "./LevelRole";
import Blacklist, { GuildBlacklist, RawGuildBlacklist } from "../Blacklist";
import WebhookStore from "../../../util/WebhookStore";
import EmbedBuilder from "../../../util/EmbedBuilder";
import { BooleanData, OkPacket } from "@util/@types/MariaDB";
import { DataTypes, DeepPartial, SomePartial, Writeable } from "@uwu-codes/types";
import BotFunctions from "@util/BotFunctions";
import config from "@config";
import db from "@db";
import { Collection } from "@augu/collections";
import * as crypto from "crypto";

export interface RawGuildConfig {
	id: string;
	modlog_enabled: BooleanData;
	modlog_case_editing_enabled: BooleanData;
	modlog_case_deleting_enabled: BooleanData;
	modlog_edit_others_cases_enabled: BooleanData;
	modlog_webhook_id: string | null;
	modlog_webhook_token: string | null;
	modlog_webhook_channel_id: string | null;
	settings_default_yiff_type: string;
	settings_e621_thumbnail_type: string;
	settings_mute_role: string | null;
	settings_command_images: BooleanData;
	settings_snipe_disabled: BooleanData;
	settings_delete_mod_commands: BooleanData;
	settings_announce_level_up: BooleanData;
}

export type GuildConfigKV = DataTypes<GuildConfig>;
export default class GuildConfig {
	id: string;
	prefix: Array<Prefix>;
	tags = new Collection<string, Tag>();
	selfRoles = new Collection<string, SelfRole>();
	levelRoles: Array<LevelRole>;
	logEvents: Array<LogEvent>;
	disable: Array<AnyDisableEntry>;
	modlog: {
		enabled: boolean;
		caseEditingEnabled: boolean;
		caseDeletingEnabled: boolean;
		editOthersCasesEnabled: boolean;
		webhook: Record<"id" | "token" | "channelId", string> | null;
	};
	settings: {
		defaultYiffType: typeof config["yiffTypes"][number];
		e621ThumbnailType: "gif" | "image" | "none";
		muteRole: string | null;
		commandImages: boolean;
		snipeDisabled: boolean;
		deleteModCommands: boolean;
		announceLevelUp: boolean;
	};
	constructor(id: string, data: RawGuildConfig, prefixData: Array<RawPrefix>, selfRolesData: Array<RawSelfRole>, levelRolesData: Array<RawLevelRole>, tagsData: Array<RawTag>, logEventsData: Array<RawLogEvent>, disabeData: Array<RawDisableEntry>) {
		this.id = id;
		this.load(data, prefixData, selfRolesData, levelRolesData, tagsData, logEventsData, disabeData);
	}

	private load(data: RawGuildConfig, prefixData: Array<RawPrefix>, selfRolesData: Array<RawSelfRole>, levelRolesData: Array<RawLevelRole>, tagsData: Array<RawTag>, logEventsData: Array<RawLogEvent>, disableData: Array<RawDisableEntry>) {
		this.id = data.id;
		this.prefix = prefixData.map(d => new Prefix(d, this));
		this.tags.clear();
		tagsData.forEach(d => this.tags.set(d.name, new Tag(d, this)));
		this.selfRoles.clear();
		selfRolesData.forEach(d => this.selfRoles.set(d.role, new SelfRole(d, this)));
		this.levelRoles = levelRolesData.map(l => new LevelRole(l, this));
		this.logEvents = logEventsData.map(l => new LogEvent(l, this));
		this.disable = disableData.map(d => new DisableEntry(d, this) as AnyDisableEntry);
		this.modlog = {
			enabled: Boolean(data.modlog_enabled),
			caseEditingEnabled: Boolean(data.modlog_case_editing_enabled),
			caseDeletingEnabled: Boolean(data.modlog_case_deleting_enabled),
			editOthersCasesEnabled: Boolean(data.modlog_edit_others_cases_enabled),
			webhook: data.modlog_webhook_id === null || data.modlog_webhook_token === null || data.modlog_webhook_channel_id === null ? null : {
				id: data.modlog_webhook_id,
				token: data.modlog_webhook_token,
				channelId: data.modlog_webhook_channel_id
			}
		};
		this.settings = {
			defaultYiffType: data.settings_default_yiff_type as GuildConfig["settings"]["defaultYiffType"],
			e621ThumbnailType: data.settings_e621_thumbnail_type as GuildConfig["settings"]["e621ThumbnailType"],
			muteRole: data.settings_mute_role,
			commandImages: Boolean(data.settings_command_images),
			snipeDisabled: Boolean(data.settings_snipe_disabled),
			deleteModCommands: Boolean(data.settings_delete_mod_commands),
			announceLevelUp: Boolean(data.settings_announce_level_up)
		};
		return this;
	}

	async reload() {
		const v = await db.getGuild(this.id, true, true);
		if (!v) throw new Error(`Unexpected undefined on GuildConfig#reload (id: ${this.id})`);
		this.load(v.guild, v.prefix, v.selfRoles, v.levelRoles, v.tags, v.logEvents, v.disable);
		return this;
	}

	async edit(data: DeepPartial<GuildConfigKV>) {
		if (data.prefix) throw new TypeError("Field 'prefix' cannot be used in the generic edit function.");
		if (data.tags) throw new TypeError("Field 'tags' cannot be used in the generic edit function.");
		if (data.selfRoles) throw new TypeError("Field 'selfRoles' cannot be used in the generic edit function.");
		if (data.levelRoles) throw new TypeError("Field 'levelRoles' cannot be used in the generic edit function.");
		if (data.logEvents) throw new TypeError("Field 'logEvents' cannot be used in the generic edit function.");
		if (data.disable) throw new TypeError("Field 'disable' cannot be used in the generic edit function.");

		const v = {
			modlog_enabled: data.modlog === undefined || data.modlog.enabled === undefined ? undefined : Boolean(data.modlog.enabled) === true ? 1 : 0,
			modlog_case_editing_enabled: data.modlog === undefined || data.modlog.caseEditingEnabled === undefined ? undefined : Boolean(data.modlog.caseEditingEnabled) === true ? 1 : 0,
			modlog_case_deleting_enabled: data.modlog === undefined || data.modlog.caseDeletingEnabled === undefined ? undefined : Boolean(data.modlog.caseDeletingEnabled) === true ? 1 : 0,
			modlog_edit_others_cases_enabled: data.modlog === undefined || data.modlog.editOthersCasesEnabled === undefined ? undefined : Boolean(data.modlog.editOthersCasesEnabled) === true ? 1 : 0,
			modlog_webhook_id: data.modlog === undefined || data.modlog.webhook === undefined ? undefined : data.modlog.webhook === null ? null : data.modlog.webhook.id ?? undefined,
			modlog_webhook_token: data.modlog === undefined || data.modlog.webhook === undefined ? undefined : data.modlog.webhook === null ? null : data.modlog.webhook.token ?? undefined,
			modlog_webhook_channel_id: data.modlog === undefined || data.modlog.webhook === undefined ? undefined : data.modlog.webhook === null ? null : data.modlog.webhook.channelId ?? undefined,
			settings_default_yiff_type: data.settings === undefined ? undefined : data.settings.defaultYiffType ?? undefined,
			settings_e621_thumbnail_type: data.settings === undefined ? undefined : data.settings.e621ThumbnailType ?? undefined,
			settings_mute_role: data.settings === undefined ? undefined : data.settings.muteRole === null ? null : data.settings.muteRole ?? undefined,
			settings_command_images: data.settings === undefined ? undefined : Boolean(data.settings.commandImages) === true ? 1 : 0,
			settings_snipe_disabled: data.settings === undefined ? undefined : Boolean(data.settings.snipeDisabled) === true ? 1 : 0,
			settings_delete_mod_commands: data.settings === undefined ? undefined : Boolean(data.settings.deleteModCommands) === true ? 1 : 0,
			settings_announce_level_up: data.settings === undefined ? undefined : Boolean(data.settings.announceLevelUp) === true ? 1 : 0
		} as Omit<RawGuildConfig, "id">;

		const keys = Object.keys(v).filter(k => v[k as keyof typeof v] !== undefined);
		const values = Object.values(v).filter(k => k !== undefined) as Array<unknown>;
		// for debug
		/* console.log("data", data);
		console.log("obj", v);
		console.log("Query:", `UPDATE guilds SET ${keys.map(j => `${j}=?`).join(", ")} WHERE id = ?`);
		console.log("Parameters:", [...values, this.id]); */
		await db.query(`UPDATE guilds SET ${keys.map(j => `${j}=?`).join(", ")} WHERE id = ?`, [...values, this.id]);
		return this.reload();
	}

	async fix() {
		// nothing to fix yet, so this is just blank
		const obj = {} as Writeable<GuildConfigKV>;

		if (JSON.stringify(obj) !== "{}") await this.edit(obj);
	}

	getFormattedPrefix(index = 0) {
		return BotFunctions.formatPrefix(this.prefix[index]);
	}

	async addTag(tag: Omit<SomePartial<TagKV, "modifiedAt" | "modifiedBy">, "id">) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO tags (id, guild_id, name, content, created_at, created_by, modified_at, modified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
			id,
			this.id,
			tag.name,
			tag.content,
			tag.createdAt,
			tag.createdBy,
			tag.modifiedAt ?? null,
			tag.modifiedBy ?? null
		]);
		return id;
	}

	async editTag(value: string, column: "id" | "name", content: string, blame?: string) {
		const res = await db.query(`UPDATE tags SET content=?, modified_at=?, modified_by=? WHERE ${column}=?`, [content, Date.now(), blame ?? null, value]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async removeTag(value: string, column: "id" | "name") {
		return db.query(`DELETE FROM tags WHERE ${column}=? AND guild_id=?`, [value, this.id]).then((r: OkPacket) => r.affectedRows > 0);
	}

	async resetTags() {
		const res = await db.query("DELETE FROM tags WHERE guild_id=?", [this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addPrefix(value: string, space = false) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO prefix (id, guild_id, value, space) VALUES (?, ?, ?, ?)", [
			id,
			this.id,
			value,
			space
		]);
		await this.reload();
		return id;
	}

	async removePrefix(value: string, column: "id" | "value") {
		const res = await db.query(`DELETE FROM prefix WHERE ${column}=? AND guild_id=?`, [value, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetPrefixes() {
		const res = await db.query("DELETE FROM prefix WHERE guild_id=?", [this.id]).then((r: OkPacket) => r.affectedRows > 0);
		await this.addPrefix(config.defaults.prefix, true);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addLogEvent(event: string, channel: string) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO logevents (id, guild_id, event, channel) VALUES (?, ?, ?, ?)", [
			id,
			this.id,
			event,
			channel
		]);
		await this.reload();
		return id;
	}

	async removeLogEvent(event: string, channel: string) {
		const res = await db.query("DELETE FROM logevents WHERE event=? AND channel=? AND guild_id=?", [event, channel, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetLogEvents() {
		const res = await db.query("DELETE FROM logevents WHERE guild_id=?", [this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addSelfRole(role: string, blame: string) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO selfroles (id, guild_id, role, added_at, added_by) VALUES (?, ?, ?, ?, ?)", [
			id,
			this.id,
			role,
			Date.now(),
			blame
		]);
		await this.reload();
		return id;
	}

	async removeSelfRole(value: string, column: "id" | "role") {
		const res = await db.query(`DELETE FROM selfroles WHERE ${column}=? AND guild_id=?`, [value, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addLevelRole(role: string, xpRequired: number) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO levelroles (id, guild_id, role, xp_required) VALUES (?, ?, ?, ?)", [
			id,
			this.id,
			role,
			xpRequired
		]);
		await this.reload();
		return id;
	}

	async removeLevelRole(value: string, column: "id" | "role") {
		const res = await db.query(`DELETE FROM levelroles WHERE ${column}=? AND guild_id=?`, [value, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetSelfRoles() {
		const res = await db.query("DELETE FROM selfroles guild_id=?", [this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async addDisableEntry(type: 0 | 1 | 2, value: string | null, filterType: 0 | 1 | 2 | 3, filterValue: string | null) {
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO disable (id, guild_id, type, value, filter_type, filter_value) VALUES (?, ?, ?, ?, ?, ?)", [
			id,
			this.id,
			type,
			value,
			filterType,
			filterValue
		]);
		await this.reload();
		return id;
	}

	async removeDisableEntry(id: string) {
		const res = await db.query("DELETE FROM disable WHERE id=? AND guild_id=?", [id, this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async resetDisableEntries() {
		const res = await db.query("DELETE FROM disable guild_id=?", [this.id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async editModlog(entryId: number, reason: string, blame?: string) {
		const res = await db.query("UPDATE modlog SET reason=?, last_edited_at=?, last_edited_by=? WHERE guild_id=? AND entry_id=?", [reason, Date.now(), blame ?? null, this.id, entryId]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async removeModlog(id: string) {
		const res = await db.query("DELETE FROM modlog WHERE id=?", [id]).then((r: OkPacket) => r.affectedRows > 0);
		if (res === false) return false;
		await this.reload();
		return true;
	}

	async getModlogEntry(id: number) {
		const [res] = await db.query("SELECT * FROM modlog WHERE guild_id=? AND entry_id=?", [this.id, id]).then(v => (v as Array<AnyRawEntry>));
		if (res === undefined) return null;
		switch (res.type) {
			case "ban": return new BanEntry(res, this);
			case "clearwarnings": return new ClearWarningsEntry(res, this);
			case "deletewarning": return new DeleteWarningEntry(res, this);
			case "kick": return new KickEntry(res, this);
			case "lockdown": return new LockDownEntry(res, this);
			case "lock": return new LockEntry(res, this);
			case "mute": return new MuteEntry(res, this);
			case "softban": return new SoftBanEntry(res, this);
			case "unban": return new UnBanEntry(res, this);
			case "unlockdown": return new UnLockDownEntry(res, this);
			case "unlock": return new UnLockEntry(res, this);
			case "unmute": return new UnMuteEntry(res, this);
			case "warn": return new WarnEntry(res, this);
		}
		/* return Promise.all(res.map(async(v) => {
			switch (v.type) {
				case "ban": return new BanEntry(v, this);
				case "clearwarnings": return new ClearWarningsEntry(v, this);
				case "deletewarning": return new DeleteWarningEntry(v, this);
				case "kick": return new KickEntry(v, this);
				case "lockdown": return new LockDownEntry(v, this);
				case "lock": return new LockEntry(v, this);
				case "mute": return new MuteEntry(v, this);
				case "softban": return new SoftBanEntry(v, this);
				case "unban": return new UnBanEntry(v, this);
				case "unlockdown": return new UnLockDownEntry(v, this);
				case "unlock": return new UnLockEntry(v, this);
				case "unmute": return new UnMuteEntry(v, this);
				case "warn": return new WarnEntry(v, this);
			}
		})); */
	}

	async checkBlacklist() {
		const res = await db.query("SELECT * FROM blacklist WHERE type=? AND guild_id=?", [Blacklist.GUILD, this.id]).then((r: Array<RawGuildBlacklist>) => r.map(b => new GuildBlacklist(b)));
		return {
			active: res.filter(b => b.active),
			expired: res.filter(b => b.expired),
			noticeShown: {
				active: res.filter(b => b.active && b.noticeShown),
				expired: res.filter(b => b.expired && b.noticeShown)
			},
			noticeNotShown: {
				active: res.filter(b => b.active && !b.noticeShown),
				expired: res.filter(b => b.expired && !b.noticeShown)
			}
		};
	}

	async addBlacklist(createdBy: string, createdByTag: string, reason: string | null, expiry: number, report: string | null) {
		await db.createGuildIfNotExists(this.id); // prototype calls
		const d = Date.now();
		const id = crypto.randomBytes(6).toString("hex");
		await db.query("INSERT INTO blacklist (id, guild_id, type, reason, expire_time, created_by, created_by_tag, created_at, report) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
			id,
			this.id,
			Blacklist.GUILD,
			reason,
			expiry ?? 0,
			createdBy,
			createdByTag,
			d,
			report
		]);
		await WebhookStore.execute("blacklist", {
			embeds: [
				new EmbedBuilder()
					.setTitle("New Guild Blacklist")
					.setDescription([
						`Guild: ${WebhookStore.client.guilds.get(this.id)?.name ?? "Unknown"} (${this.id})`,
						`Reason: ${reason ?? "None Provided."}`,
						`Expiry: ${(expiry ?? 0) === 0 ? "Never" : BotFunctions.formatDiscordTime(expiry, "short-datetime", true)}`,
						`Created By: ${createdByTag} (${createdBy})`
					].join("\n"))
					.toJSON()
			]
		});
		const [res] = await db.query("SELECT * FROM blacklist WHERE type=? AND guild_id=? AND id=? LIMIT 1", [Blacklist.GUILD, this.id, id]).then((r: Array<RawGuildBlacklist>) => r.map(b => new GuildBlacklist(b)));
		return res;
	}
}
