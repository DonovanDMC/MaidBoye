import type { ExcludedSettings } from "../../util/settings/index.js";
import Settings, { SettingsBits } from "../../util/settings/index.js";
import Util from "../../util/Util.js";
import db from "../index.js";
import { assert } from "tsafe";

interface Tag {
    content: string;
    createdAt: number;
    createdBy: string;
    modifiedAt: number | null;
    modifiedBy: string | null;
    previousContent: string | null;
}

export interface GuildConfigData {
    created_at: Date;
    id: string;
    leveling_roles: string;
    modlog_webhook_channel_id: string | null;
    modlog_webhook_id: string | null;
    modlog_webhook_token: string | null;
    selfroles: Array<string>;
    settings: string;
    tags: Record<string, Tag>;
    updated_at: Date | null;
}
export type GuildConfigCreationRequired = Pick<GuildConfigData, "id">;
export type GuildConfigCreationIgnored = "created_at" | "updated_at";
export type GuildConfigUpdateIgnored = "id" | "created_at" | "updated_at";
export type GuildConfigCreationData = GuildConfigCreationRequired & Partial<Omit<GuildConfigData, keyof GuildConfigCreationRequired | GuildConfigCreationIgnored>>;
export type GuildConfigUpdateData = Partial<Omit<GuildConfigData, GuildConfigUpdateIgnored>>;

export default class GuildConfig {
    static TABLE = "guilds";
    private _levelingRolesLevelMap?: Partial<Record<number, Array<string>>>;
    private _levelingRolesList?: Array<string>;
    private _levelingRolesRoleMap?: Partial<Record<string, number>>;
    private _tagNames?: Array<string>;
    _data: GuildConfigData;
    _settingsData: bigint;
    createdAt: Date;
    id: string;
    levelingRoles:  Array<[role: string, level: number]>;
    modlog: {
        caseDeletingEnabled: boolean;
        caseEditingEnabled: boolean;
        enabled: boolean;
        modifyOthersCasesEnabled: boolean;
        webhook: (Record<"id" | "token" | "channelID", string> & { managed: boolean; }) | null;
    };
    selfroles: Array<string>;
    settings: {
        announceLevelUp: boolean;
        autoSourcing: boolean;
        commandImages: boolean;
        dmBlame: boolean;
        snipeDisabled: boolean;
    };
    tags: Record<string, Tag>;
    updatedAt: Date | null;
    constructor(data: GuildConfigData) {
        assert(data && data.id, "invalid id found in GuildConfig");
        this.id = data.id;
        this.load(data);
    }

    get levelingRolesLevelMap() {
        return (this._levelingRolesLevelMap || (this._levelingRolesLevelMap = this.levelingRoles.reduce((a, [role, level]) => ((a![level] = [...(a![level] || []), role], a)), {} as GuildConfig["_levelingRolesLevelMap"])))!;
    }

    get levelingRolesList() {
        return (this._levelingRolesList || (this._levelingRolesList = Object.keys(this.levelingRoles)))!;
    }

    get levelingRolesRoleMap() {
        return (this._levelingRolesRoleMap || (this._levelingRolesRoleMap = this.levelingRoles.reduce((a, [role, level]) => ((a![role] = level, a)), {} as GuildConfig["_levelingRolesRoleMap"])))!;
    }

    get tagNames() {
        return (this._tagNames || (this._tagNames = Object.keys(this.tags)))!;
    }

    static async create(data: GuildConfigCreationData) {
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res, false);
        assert(createdObject !== null, "failed to create new guild config object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string, createIfNotExists: false): Promise<GuildConfig | null>;
    static async get(id: string, createIfNotExists?: true): Promise<GuildConfig>;
    static async get(id: string, createIfNotExists = true) {
        const { rows: [res] } = await db.query<GuildConfigData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        if (!res) {
            return createIfNotExists ? this.create({ id }) : null;
        }
        return new GuildConfig(res);
    }

    private load(data: GuildConfigData) {
        this._data           = data;
        this._settingsData   = BigInt(data.settings);
        const settings     = Settings.parse(this._settingsData);
        this.createdAt     = data.created_at;
        this.updatedAt     = data.updated_at;
        this.modlog        = {
            enabled:                  settings.modlogEnabled,
            caseEditingEnabled:       settings.modlogCaseEditingEnabled,
            caseDeletingEnabled:      settings.modlogCaseDeletingEnabled,
            modifyOthersCasesEnabled: settings.modlogModifyOthersCasesEnabled,
            webhook:                  !settings.modlogEnabled || data.modlog_webhook_id === null || data.modlog_webhook_token === null || data.modlog_webhook_channel_id === null ? null : {
                id:        data.modlog_webhook_id,
                token:     data.modlog_webhook_token,
                channelID: data.modlog_webhook_channel_id,
                managed:   settings.webhookManaged
            }
        };
        this.settings      = settings;
        this.selfroles     = data.selfroles;
        this.levelingRoles = data.leveling_roles.slice(1, -1).match(/"\(\d{15,25},\d{1,4}\)"/g)?.map(m => [m.slice(2).split(",")[0], Number(m.slice(0, -2).split(",")[1])]) ?? [];
        this.tags          = data.tags;
        // make sure we reset the cached values when new data is loaded
        if (this._levelingRolesRoleMap)  {
            this._levelingRolesRoleMap = undefined;
        }
        if (this._levelingRolesLevelMap) {
            this._levelingRolesLevelMap = undefined;
        }
        if (this._levelingRolesList)     {
            this._levelingRolesList = undefined;
        }
        if (this._tagNames)              {
            this._tagNames = undefined;
        }
    }

    async addLevelingRole(role: string, level: number) {
        this.levelingRoles = [...this.levelingRoles, [role, level]];
        await db.query(`UPDATE ${GuildConfig.TABLE} SET leveling_roles=ARRAY[${this.levelingRoles.map(([r, l]) => `ROW('${r}', ${l})::LEVELING_ROLE`).join(", ")}], updated_at=CURRENT_TIMESTAMP(3) WHERE id = $1`, [this.id]);
        this._data.leveling_roles = `{${this.levelingRoles.map(([r, l]) => `(${r}, ${l})`).join(", ")}}`;
        return this.load(this._data);
    }

    async delete() {
        return GuildConfig.delete(this.id);
    }

    async edit(data: GuildConfigUpdateData) {
        const success = await Util.genericEdit(GuildConfig.TABLE, this.id, Util.removeUndefinedKV(data));
        if (success) {
            this.load(Util.removeUndefinedKV({ ...this._data, ...data }));
        }
        return success;
    }

    async removeLevelingRole(role: string) {
        this.levelingRoles = this.levelingRoles.filter(([r, l]) => r !== role && l !== this.levelingRolesRoleMap[role]);
        await db.query(`UPDATE ${GuildConfig.TABLE} SET leveling_roles=ARRAY[${this.levelingRoles.map(([r, l]) => `ROW('${r}', ${l})::LEVELING_ROLE`).join(", ")}], updated_at=CURRENT_TIMESTAMP(3) WHERE id = $1`, [this.id]);
        this._data.leveling_roles = `{${this.levelingRoles.map(([r, l]) => `(${r}, ${l})`).join(", ")}}`;
        return this.load(this._data);
    }

    async resetModLog() {
        await this.edit({
            modlog_webhook_id:         null,
            modlog_webhook_token:      null,
            modlog_webhook_channel_id: null
        });
        if (this.modlog.webhook?.managed) {
            await this.setSetting("WEBHOOK_MANAGED", false);
        }
    }

    async setModLog(id: string, token: string, channel: string, managed = false) {
        await this.edit({
            modlog_webhook_id:         id,
            modlog_webhook_token:      token,
            modlog_webhook_channel_id: channel
        });
        if (this.modlog.webhook?.managed !== managed) {
            await this.setSetting("WEBHOOK_MANAGED", managed);
        }
    }

    async setSetting(type: Exclude<keyof typeof SettingsBits, ExcludedSettings>, value: boolean) {
        const settings = String(value ? Util.addBits(this._settingsData, SettingsBits[type]) : Util.removeBits(this._settingsData, SettingsBits[type]));
        return this.edit({ settings });
    }

    async setSettings(values: Partial<Record<Exclude<keyof typeof SettingsBits, ExcludedSettings>, boolean>>) {
        let settings = this._settingsData;
        for (const [type, value] of Object.entries(values)) {
            settings = value ? Util.addBits(settings, SettingsBits[type as keyof typeof SettingsBits]) : Util.removeBits(settings, SettingsBits[type as keyof typeof SettingsBits]);
        }
        return this.edit({ settings: String(settings) });
    }
}
