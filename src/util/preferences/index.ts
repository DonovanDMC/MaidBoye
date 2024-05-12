/// <reference path="../@types/Oceanic.d.ts" />
import type BasePreference from "./structure/BasePreference.js";
import type EmptyPreference from "./structure/Empty.js";
import type { E621ThumbnailType, YiffTypes } from "../../db/Models/UserConfig.js";
import Util from "../Util.js";
import type { CommandInteraction, ValidLocation } from "../cmd/Command.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";
import Debug from "../Debug.js";
import { Timer } from "@uwu-codes/utils";
import type { ModuleImport } from "@uwu-codes/types";
import type { ApplicationCommandOptionsWithOptions, InteractionOptionsWithValue } from "oceanic.js";
import assert from "node:assert";
import { readdir } from "node:fs/promises";

export default class Preferences {
    private static list: Array<BasePreference> = [];
    private static pages: Array<Array<BasePreference>> = [];
    private static findIndex(name: string) {
        return this.list.findIndex(val => val.name === name);
    }

    static get(name: string) {
        return this.list[this.findIndex(name)];
    }

    static getAll() {
        return Array.from(this.list);
    }

    static getByID(id: number) {
        // by default, typings say that a value is guaranteed - which it isn't
        return (this.list[id] || null) as BasePreference | null;
    }

    static getByInteractionName(name: string) {
        return this.list.find(v => v.interactionsName === name);
    }

    static getOptions() {
        return this.getAll().reduce((a,b) => a.concat(b.interactionsOption.finalizeOption()), [] as Array<ApplicationCommandOptionsWithOptions>);
    }

    static getPage(id: number) {
        return this.pages[id];
    }

    static getPageCount() {
        return this.pages.length;
    }

    static getPages() {
        return Array.from(this.pages);
    }

    static async handleInteraction(interaction: CommandInteraction<ValidLocation.BOTH>, uConfig: UserConfig) {
        const opt = interaction.data.options.raw[0];
        if ("options" in opt && opt.options && opt.options.length !== 0) {
            const preference = this.getByInteractionName(opt.name);
            if (preference) {
                await preference.handleInteraction(interaction, uConfig, (opt.options[0] as InteractionOptionsWithValue).value);
            }
        }
    }

    static async loadAll() {
        const ext = import.meta.url.slice(-2);
        const files = (await readdir(new URL(".", import.meta.url), { withFileTypes: true })).filter(f => f.isFile() && ![`index.${ext}`].includes(f.name));
        for (const { name: file } of files) {
            Debug("preferemces:load", `Loading "${file}"`);
            const start = Timer.getTime();
            let set = await import(new URL(file, import.meta.url).pathname) as ModuleImport<typeof EmptyPreference>;
            if ("default" in set) {
                set = set.default;
            }
            const inst = new set();
            [inst.id, inst.page] = this.register(inst);
            const end = Timer.getTime();
            Debug("preferences:load", `Loaded preference "${inst.name}" in ${Timer.calc(start, end, 3, false)}`);
        }
    }

    static parse(val: bigint) {
        let defaultYiffType: YiffTypes = Config.yiffTypes[0];
        if (Util.hasBits(val, PreferenceBits.DEFAULT_YIFF_TYPE_GAY)) {
            defaultYiffType = "gay";
        } else if (Util.hasBits(val, PreferenceBits.DEFAULT_YIFF_TYPE_STRAIGHT)) {
            defaultYiffType = "straight";
        } else if (Util.hasBits(val, PreferenceBits.DEFAULT_YIFF_TYPE_LESBIAN)) {
            defaultYiffType = "lesbian";
        } else if (Util.hasBits(val, PreferenceBits.DEFAULT_YIFF_TYPE_GYNOMORPH)) {
            defaultYiffType = "gynomorph";
        } else if (Util.hasBits(val, PreferenceBits.DEFAULT_YIFF_TYPE_ANDROMORPH)) {
            defaultYiffType = "andromorph";
        }

        let e621ThumbnailType: E621ThumbnailType = Config.e621ThumbnailTypes[0];
        if (Util.hasBits(val, PreferenceBits.E621_THUMBNAIL_TYPE_NONE)) {
            e621ThumbnailType = "none";
        } else if (Util.hasBits(val, PreferenceBits.E621_THUMBNAIL_TYPE_IMAGE)) {
            e621ThumbnailType = "image";
        } else if (Util.hasBits(val, PreferenceBits.E621_THUMBNAIL_TYPE_GIF)) {
            e621ThumbnailType = "image";
        }
        return {
            disableSnipes:           Util.hasBits(val, PreferenceBits.DISABLE_SNIPES),
            disableMarriageRequests: Util.hasBits(val, PreferenceBits.DISABLE_MARRIAGE_REQUESTS),
            ephemeral:               Util.hasBits(val, PreferenceBits.EPHEMERAL),
            defaultYiffType,
            e621ThumbnailType,
            e621NoVideo:             Util.hasBits(val, PreferenceBits.E621_NO_VIDEO),
            e621NoFlash:             Util.hasBits(val, PreferenceBits.E621_NO_FLASH)
        };
    }

    static register<T extends BasePreference>(preference: T) {
        if (preference.shortDescription.length > 50) {
            throw new Error(`short description for preference "${preference.name}" is over 50 characters`);
        }
        if (preference.description.length > 100) {
            throw new Error(`description for preference "${preference.name}" is over 100 characters`);
        }
        assert(this.get(preference.name) === undefined, new Error(`duplicate preference (${preference.name})`).stack);
        const id = this.list.push(preference) - 1;
        let pageID = this.pages.length  - 1;
        if (pageID < 0) {
            pageID = 0;
        }
        let page = this.pages[pageID];
        if (!page) {
            page = [];
        }
        if (page.length >= 3) {
            pageID++;
            page = [];
        }
        this.pages[pageID] = [...page, preference];
        Debug("preferences:register", `Registered preference "${preference.name}" (id: ${id}, page: ${pageID})`);
        return [id, pageID] as [id: number, pageID: number];
    }
}

export const PreferenceBits = {
    DISABLE_SNIPES:               1n << 0n,
    DISABLE_MARRIAGE_REQUESTS:    1n << 1n,
    EPHEMERAL:                    1n << 2n,
    DEFAULT_YIFF_TYPE_GAY:        1n << 3n,
    DEFAULT_YIFF_TYPE_STRAIGHT:   1n << 4n,
    DEFAULT_YIFF_TYPE_LESBIAN:    1n << 5n,
    DEFAULT_YIFF_TYPE_GYNOMORPH:  1n << 6n,
    DEFAULT_YIFF_TYPE_ANDROMORPH: 1n << 7n,
    E621_THUMBNAIL_TYPE_NONE:     1n << 8n,
    E621_THUMBNAIL_TYPE_IMAGE:    1n << 9n,
    /** @deprecated disabled at service */
    E621_THUMBNAIL_TYPE_GIF:      1n << 10n,
    E621_NO_VIDEO:                1n << 11n,
    E621_NO_FLASH:                1n << 12n
};
export type ExcludedPreferences = `DEFAULT_YIFF_TYPE_${"GAY" | "STRAIGHT" | "LESBIAN" | "GYNOMORPH" | "ANDROMORPH"}` | `E621_THUMBNAIL_TYPE_${"NONE" | "IMAGE" | "GIF"}`;
export const DefaultPreferencesBits = PreferenceBits.E621_NO_FLASH;
