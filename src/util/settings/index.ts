/// <reference path="../@types/Oceanic.d.ts" />
import type EmptySetting from "./structure/Empty.js";
import type BaseSetting from "./structure/BaseSetting.js";
import Util from "../Util.js";
import type { CommandInteraction, ValidLocation } from "../cmd/Command.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Debug from "../Debug.js";
import { assert } from "tsafe";
import type { ModuleImport } from "@uwu-codes/types";
import { Timer } from "@uwu-codes/utils";
import type { ApplicationCommandOptions, InteractionOptionsWithValue } from "oceanic.js";
import { readdir } from "fs/promises";

// load must be called from a different file
export default class Settings {
    private static list: Array<BaseSetting> = [];
    private static pages: Array<Array<BaseSetting>> = [];
    private static findIndex(name: string) {
        return this.list.findIndex(val => val.name === name);
    }

    private static register<T extends BaseSetting>(setting: T) {
        if (setting.shortDescription.length > 50) throw new Error(`short description for setting "${setting.name}" is over 50 characters`);
        if (setting.description.length > 100) throw new Error(`description for setting "${setting.name}" is over 100 characters`);
        assert(this.get(setting.name) === undefined, new Error(`duplicate setting (${setting.name})`).stack);
        const id = this.list.push(setting) - 1;
        let pageID = this.pages.length  - 1;
        if (pageID < 0) pageID = 0;
        let page = this.pages[pageID];
        if (!page) page = [];
        if (page.length >= 3) {
            pageID++;
            page = [];
        }
        this.pages[pageID] = [...page, setting];
        Debug("settings:register", `Registered setting "${setting.name}" (id: ${id}, page: ${pageID})`);
        return [id, pageID] as [id: number, pageID: number];
    }

    static get(name: string) {
        return this.list[this.findIndex(name)];
    }

    static getAll() {
        return Array.from(this.list);
    }

    static getByID(id: number) {
        // by default, typings say that a value is guaranteed - which it isn't
        return (this.list[id] || null) as BaseSetting | null;
    }

    static getByInteractionName(name: string) {
        return this.list.find(v => v.interactionsName === name);
    }

    static getOptions() {
        return this.getAll().reduce((a,b) => a.concat(b.interactionsOption.finalizeOption()), [] as Array<ApplicationCommandOptions>);
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

    static async handleInteraction(interaction: CommandInteraction<ValidLocation.GUILD>, gConfig: GuildConfig) {
        const opt = interaction.data.options.raw[0];
        if ("options" in opt && opt.options && opt.options.length > 0 && interaction.guildID) {
            const setting = this.getByInteractionName(opt.name);
            if (setting) await setting.handleInteraction(interaction, gConfig, (opt.options[0] as InteractionOptionsWithValue).value);
        }
    }

    static async loadAll() {
        const ext = import.meta.url.slice(-2);
        const files = (await readdir(new URL(".", import.meta.url), { withFileTypes: true })).filter(f => f.isFile() && ![`index.${ext}`].includes(f.name));
        for (const { name: file } of files) {
            Debug("settings:load", `Loading "${file}"`);
            const start = Timer.getTime();
            let set = await import(new URL(`./${file}`, import.meta.url).pathname) as ModuleImport<typeof EmptySetting>;
            if ("default" in set) set = set.default;
            const inst = new set();
            [inst.id, inst.page] = this.register(inst);
            const end = Timer.getTime();
            Debug("settings:load", `Loaded option "${inst.name}" in ${Timer.calc(start, end, 3, false)}`);
        }
    }

    static parse(val: bigint) {
        return {
            commandImages:                  Util.hasBits(val, SettingsBits.COMMAND_IMAGES),
            snipeDisabled:                  Util.hasBits(val, SettingsBits.SNIPE_DISABLED),
            announceLevelUp:                Util.hasBits(val, SettingsBits.ANNOUNCE_LEVEL_UP),
            autoSourcing:                   Util.hasBits(val, SettingsBits.AUTO_SOURCING),
            modlogEnabled:                  Util.hasBits(val, SettingsBits.MODLOG_ENABLED),
            modlogCaseDeletingEnabled:      Util.hasBits(val, SettingsBits.MODLOG_CASE_DELETING_ENABLED),
            modlogCaseEditingEnabled:       Util.hasBits(val, SettingsBits.MODLOG_CASE_EDITING_ENABLED),
            modlogModifyOthersCasesEnabled: Util.hasBits(val, SettingsBits.MODLOG_MODIFY_OTHERS_CASES_ENABLED),
            webhookManaged:                 Util.hasBits(val, SettingsBits.WEBHOOK_MANAGED),
            dmBlame:                        Util.hasBits(val, SettingsBits.DM_BLAME)
        };
    }
}

// we don't really need bigint until after 30 but it's better to start early
export const SettingsBits = {
    COMMAND_IMAGES:                     1n << 0n,
    SNIPE_DISABLED:                     1n << 1n,
    ANNOUNCE_LEVEL_UP:                  1n << 2n,
    AUTO_SOURCING:                      1n << 3n,
    MODLOG_ENABLED:                     1n << 4n,
    MODLOG_CASE_DELETING_ENABLED:       1n << 5n,
    MODLOG_CASE_EDITING_ENABLED:        1n << 6n,
    MODLOG_MODIFY_OTHERS_CASES_ENABLED: 1n << 7n,
    WEBHOOK_MANAGED:                    1n << 8n,
    DM_BLAME:                           1n << 9n
};
export type ExcludedSettings = never;
export const DefaultSettingsBits = 0;
