import Util from "../../util/Util.js";
import db from "../index.js";
import type { ExcludedPreferences } from "../../util/preferences/index";
import Preferences, { PreferenceBits } from "../../util/preferences/index.js";
import type Config from "../../config/index.js";
import assert from "node:assert";

export interface UserConfigData {
    apikey: string | null;
    created_at: Date;
    id: string;
    levels: Record<string, number>;
    marriage_partners: Array<string>;
    preferences: string;
    updated_at: Date | null;
}
export type UserConfigCreationRequired = Pick<UserConfigData, "id">;
export type UserConfigCreationIgnored = "created_at" | "updated_at";
export type UserConfigUpdateIgnored = "id" | "created_at" | "updated_at";
export type UserConfigCreationData = UserConfigCreationRequired & Partial<Omit<UserConfigData, keyof UserConfigCreationRequired | UserConfigCreationIgnored>>;
export type UserConfigUpdateData = Partial<Omit<UserConfigData, UserConfigUpdateIgnored>>;

export type E621ThumbnailType = typeof Config["e621ThumbnailTypes"][number];
export type YiffTypes = typeof Config["yiffTypes"][number];
export default class UserConfig {
    static TABLE = "users";
    _data: UserConfigData;
    _preferencesData: bigint;
    apikey: string | null;
    createdAt: Date;
    id: string;
    levels: Record<string, number>;
    marriagePartners: Array<string>;
    preferences: {
        defaultYiffType: YiffTypes;
        disableMarriageRequests: boolean;
        disableSnipes: boolean;
        e621NoFlash: boolean;
        e621NoVideo: boolean;
        e621ThumbnailType: E621ThumbnailType;
        ephemeral: boolean;
    };
    updatedAt: Date | null;
    constructor(data: UserConfigData) {
        assert(data && data.id, "invalid id found in UserConfig");
        this.id = data.id;
        this.load(data);
    }

    static async addXP(user: string, guild: string) {
        await this.createIfNotExists(user);
        const levels = await this.getXP(user);
        const amount = Math.floor(Math.random() * 10) + 5;
        levels[guild] = (levels[guild] || 0) + amount;
        await Util.genericEdit(UserConfig, user, Util.removeUndefinedKV({ levels }));
        await db.redis.set(`leveling:${user}:${guild}`, levels[guild]);
        return levels[guild];
    }

    static async create(data: UserConfigCreationData) {
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new user config object");
        return createdObject;
    }

    static async createIfNotExists(id: string) {
        return (await db.insert<string>(this.TABLE, { id }, true)) === null;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async exists(id: string) {
        const { rows: [res] } = await db.query<{ id: string; }>(`SELECT id FROM ${this.TABLE} WHERE id = $1`, [id]);
        return !!res;
    }

    static async get(id: string, createIfNotExists: false): Promise<UserConfig | null>;
    static async get(id: string, createIfNotExists?: true): Promise<UserConfig>;
    static async get(id: string, createIfNotExists = true) {
        const { rows: [res] } = await db.query<UserConfigData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        if (!res) {
            return createIfNotExists ? this.create({ id }) : null;
        }
        return new UserConfig(res);
    }

    static async getByIDAndAPIKey(id: string, apikey: string) {
        const { rows: [res] } = await db.query<UserConfigData>(`SELECT * FROM ${this.TABLE} WHERE id = $1 AND apikey = $2`, [id, apikey]);
        return res ? new UserConfig(res) : null;
    }

    static async getEphemeral(id: string) {
        try {
            const { rows: [{ preferences }] } = await db.query<{ preferences: string; }>(`SELECT preferences FROM ${this.TABLE} WHERE id = $1`, [id]);
            return Util.hasBits(BigInt(preferences), PreferenceBits.EPHEMERAL);
        } catch {
            return false;
        }
    }

    static async getXP(user: string): Promise<Record<string, number>>;
    static async getXP(user: string, guild: string): Promise<number>;
    static async getXP(user: string, guild?: string) {
        await this.createIfNotExists(user);
        const { rows: [res] } = await db.query<{ levels: Record<string, number>; }>(`SELECT levels FROM ${this.TABLE} WHERE id = $1`, [user]);
        return guild ? res.levels[guild] || 0 : res.levels;
    }

    private load(data: UserConfigData) {
        this._data            = data;
        this._preferencesData = BigInt(data.preferences);
        const preferences     = Preferences.parse(this._preferencesData);
        this.apikey           = data.apikey;
        this.createdAt        = data.created_at;
        this.levels           = data.levels;
        this.marriagePartners = data.marriage_partners;
        this.preferences      = preferences;
        this.updatedAt        = data.updated_at;
    }

    async addXP(guild: string) {
        return UserConfig.addXP(this.id, guild);
    }

    async delete() {
        return UserConfig.delete(this.id);
    }

    async edit(data: UserConfigUpdateData) {
        const res = await Util.genericEdit(UserConfig, this.id, Util.removeUndefinedKV(data));
        if (res !== null) {
            this.load(res);
        }

        return res !== null;
    }

    async getXP() {
        return UserConfig.getXP(this.id);
    }

    async setDefaultYiffType(type: YiffTypes) {
        let typeString: keyof typeof PreferenceBits;
        switch (type) {
            case "gay": {
                typeString = "DEFAULT_YIFF_TYPE_GAY";
                break;
            }

            case "straight": {
                typeString = "DEFAULT_YIFF_TYPE_STRAIGHT";
                break;
            }

            case "lesbian": {
                typeString = "DEFAULT_YIFF_TYPE_LESBIAN";
                break;
            }

            case "gynomorph": {
                typeString = "DEFAULT_YIFF_TYPE_GYNOMORPH";
                break;
            }

            case "andromorph": {
                typeString = "DEFAULT_YIFF_TYPE_ANDROMORPH";
                break;
            }
        }
        const preferences = String(
            Util.addBits(
                Util.removeBits(
                    this._preferencesData,
                    PreferenceBits.DEFAULT_YIFF_TYPE_GAY,
                    PreferenceBits.DEFAULT_YIFF_TYPE_STRAIGHT,
                    PreferenceBits.DEFAULT_YIFF_TYPE_LESBIAN,
                    PreferenceBits.DEFAULT_YIFF_TYPE_GYNOMORPH,
                    PreferenceBits.DEFAULT_YIFF_TYPE_ANDROMORPH
                ),
                PreferenceBits[typeString])
        );

        return this.edit({ preferences });
    }

    async setE621ThumbnailType(type: E621ThumbnailType) {
        const preferences = String(
            Util.addBits(
                Util.removeBits(
                    this._preferencesData,
                    PreferenceBits.E621_THUMBNAIL_TYPE_NONE,
                    PreferenceBits.E621_THUMBNAIL_TYPE_IMAGE,
                    PreferenceBits.E621_THUMBNAIL_TYPE_GIF
                ),
                PreferenceBits[
                    type === "image" ? "E621_THUMBNAIL_TYPE_IMAGE" : "E621_THUMBNAIL_TYPE_NONE"
                ])
        );

        return this.edit({ preferences });
    }

    async setPreference(type: Exclude<keyof typeof PreferenceBits, ExcludedPreferences>, value: boolean) {
        const preferences = String(value ? Util.addBits(this._preferencesData, PreferenceBits[type]) : Util.removeBits(this._preferencesData, PreferenceBits[type]));
        return this.edit({ preferences });
    }
}
