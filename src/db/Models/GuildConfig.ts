/* eslint-disable unicorn/prefer-math-trunc */
import Settings, { SettingsBits } from "../../util/settings/index.js";
import Util from "../../util/Util.js";
import db, { DBLiteral } from "../index.js";
import type { AllowSymbol } from "../../util/@types/misc.js";
import { Strings } from "@uwu-codes/utils";
import assert from "node:assert";

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
    welcome_message: string;
    welcome_modifiers: number;
    welcome_webhook_channel_id: string | null;
    welcome_webhook_id: string | null;
    welcome_webhook_token: string | null;
}
export type GuildConfigCreationRequired = Pick<GuildConfigData, "id">;
export type GuildConfigCreationIgnored = "created_at" | "updated_at";
export type GuildConfigUpdateIgnored = "id" | "created_at" | "updated_at";
export type GuildConfigCreationData = GuildConfigCreationRequired & Partial<Omit<GuildConfigData, keyof GuildConfigCreationRequired | GuildConfigCreationIgnored>>;
export type GuildConfigUpdateData = AllowSymbol<Partial<Omit<GuildConfigData, GuildConfigUpdateIgnored>>>;

export enum GuildWelcomeModifiers {
    DISABLE_USER_MENTIONS        = 1 << 0,
    DISABLE_ROLE_MENTIONS        = 1 << 1,
    DISABLE_EVERYONE_MENTIONS    = 1 << 2,
    SUPPRESS_EMBEDS              = 1 << 3,
    WAIT_FOR_PASSING_MEMBER_GATE = 1 << 4,
    SUPPRESS_NOTIFICATIONS       = 1 << 5,
}

export const ModlogSettingKeys = ["MODLOG_CASE_DELETING_ENABLED", "MODLOG_CASE_EDITING_ENABLED", "MODLOG_MODIFY_OTHERS_CASES_ENABLED"] as const;
export const ModlogSettingNames: Record<typeof ModlogSettingKeys[number], string> = {
    MODLOG_CASE_DELETING_ENABLED:       "Case Deleting",
    MODLOG_CASE_EDITING_ENABLED:        "Case Editing",
    MODLOG_MODIFY_OTHERS_CASES_ENABLED: "Modify Others Cases (Edit & Delete)"
};
export const ModlogSettingChoices = Object.entries(ModlogSettingNames).map(([value, name]) => ({
    name,
    value
}));
export const GuildWelcomeModifierKeys = Object.keys(GuildWelcomeModifiers).filter(k => isNaN(Number(k))) as Array<keyof typeof GuildWelcomeModifiers>;
export const GuildWelcomeModifiersChoices = GuildWelcomeModifierKeys.map(key => ({
    name:  Strings.ucwords(key.replace(/_/g, " ")),
    value: key
}));

export default class GuildConfig {
    static TABLE = "guilds";
    private _levelingRolesLevelMap?: Partial<Record<number, Array<string>>>;
    private _levelingRolesList?: Array<string>;
    private _levelingRolesRoleMap?: Partial<Record<string, number>>;
    private _tagNames?: Array<string>;
    _data: GuildConfigData;
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
    welcome: {
        enabled: boolean;
        message: string;
        modifiers: Array<keyof typeof GuildWelcomeModifiers>;
        webhook: (Record<"id" | "token" | "channelID", string> & { managed: boolean; }) | null;
    };
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

    static async ensureExists(id: string) {
        await this.get(id, true);
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
        const settings     = Settings.parse(BigInt(data.settings));
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
                managed:   settings.modlogWebhookManaged
            }
        };
        this.settings      = settings;
        this.selfroles     = data.selfroles;
        this.levelingRoles = data.leveling_roles.slice(1, -1).match(/"\(\d{15,25},\d{1,4}\)"/g)?.map(m => [m.slice(2).split(",")[0], Number(m.slice(0, -2).split(",")[1])]) ?? [];
        this.tags          = data.tags;
        this.welcome       = {
            enabled:   settings.welcomeEnabled,
            message:   data.welcome_message,
            modifiers: Util.getFlagsArray(GuildWelcomeModifiers, data.welcome_modifiers),
            webhook:   !settings.welcomeEnabled || data.welcome_webhook_id === null || data.welcome_webhook_token === null || data.welcome_webhook_channel_id === null ? null : {
                id:        data.welcome_webhook_id,
                token:     data.welcome_webhook_token,
                channelID: data.welcome_webhook_channel_id,
                managed:   settings.welcomeWebhookManaged
            }
        };
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
        const res = await Util.genericEdit(GuildConfig, this.id, Util.removeUndefinedKV(data));
        if (res !== null) {
            this.load(res);
        }

        return res !== null;
    }

    async removeLevelingRole(role: string) {
        this.levelingRoles = this.levelingRoles.filter(([r, l]) => r !== role && l !== this.levelingRolesRoleMap[role]);
        await db.query(`UPDATE ${GuildConfig.TABLE} SET leveling_roles=ARRAY[${this.levelingRoles.map(([r, l]) => `ROW('${r}', ${l})::LEVELING_ROLE`).join(", ")}], updated_at=CURRENT_TIMESTAMP(3) WHERE id = $1`, [this.id]);
        this._data.leveling_roles = `{${this.levelingRoles.map(([r, l]) => `(${r}, ${l})`).join(", ")}}`;
        return this.load(this._data);
    }

    async resetModLog() {
        await this.setSettings({
            MODLOG_ENABLED:         false,
            MODLOG_WEBHOOK_MANAGED: false
        });
        await this.edit({
            modlog_webhook_id:         null,
            modlog_webhook_token:      null,
            modlog_webhook_channel_id: null
        });
    }

    async resetWelcome() {
        await this.setSettings({
            WELCOME_ENABLED:         false,
            WELCOME_WEBHOOK_MANAGED: false
        });
        await this.edit({
            welcome_webhook_id:         null,
            welcome_webhook_token:      null,
            welcome_webhook_channel_id: null,
            welcome_message:            DBLiteral.DEFAULT
        });
    }

    async setModLog(id: string, token: string, channel: string, managed = false) {
        await this.setSettings({
            MODLOG_ENABLED:         true,
            MODLOG_WEBHOOK_MANAGED: managed
        });
        await this.edit({
            modlog_webhook_id:         id,
            modlog_webhook_token:      token,
            modlog_webhook_channel_id: channel
        });
    }

    async setSetting(type: keyof typeof SettingsBits, value: boolean) {
        const val = BigInt(this._data.settings);
        const settings = String(value ? Util.addBits(val, SettingsBits[type]) : Util.removeBits(val, SettingsBits[type]));
        return this.edit({ settings });
    }

    async setSettings(values: Partial<Record<keyof typeof SettingsBits, boolean>>) {
        let settings = BigInt(this._data.settings);
        for (const [type, value] of Object.entries(values)) {
            settings = value ? Util.addBits(settings, SettingsBits[type as keyof typeof SettingsBits]) : Util.removeBits(settings, SettingsBits[type as keyof typeof SettingsBits]);
        }
        return this.edit({ settings: String(settings) });
    }

    async setWelcome(id: string, token: string, channel: string, managed = false) {
        await this.setSettings({
            WELCOME_ENABLED:         true,
            WELCOME_WEBHOOK_MANAGED: managed
        });
        await this.edit({
            welcome_webhook_id:         id,
            welcome_webhook_token:      token,
            welcome_webhook_channel_id: channel
        });
    }

    async setWelcomeModifier(type: typeof GuildWelcomeModifierKeys[number], value: boolean) {
        return this.edit({
            welcome_modifiers: value ? Util.addBits(this._data.welcome_modifiers, GuildWelcomeModifiers[type]) : Util.removeBits(this._data.welcome_modifiers, GuildWelcomeModifiers[type])
        });
    }
}
