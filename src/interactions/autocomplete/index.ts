/// <reference path="../../util/@types/Oceanic.d.ts" />
import BaseAutocomplete from "./structure/BaseAutocomplete.js";
import type EmptyAutocomplete from "./structure/Empty.js";
import Logger from "../../util/Logger.js";
import type { AutocompleteInteraction } from "../../util/cmd/Command.js";
import Debug from "../../util/Debug.js";
import { Timer } from "@uwu-codes/utils";
import type { ModuleImport } from "@uwu-codes/types";
import type { InteractionOptionsInteger, InteractionOptionsNumber, InteractionOptionsString } from "oceanic.js";
import assert from "node:assert";
import { readdir } from "node:fs/promises";

export type AnyAutocompleteFocus = InteractionOptionsString | InteractionOptionsInteger | InteractionOptionsNumber;
const thisDirectory = new URL(".", import.meta.url).pathname.slice(0, -1);
export default class Autocomplete {
    private static list: Array<BaseAutocomplete> = [];
    static findIndex(cmd: string, option: string) {
        return this.list.findIndex(val => val.command === cmd && val.option === option);
    }

    static get(cmd: string, option: string) {
        // this isn't using an actual array
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        return this.list[this.findIndex(cmd, option)];
    }

    static getAll() {
        return Array.from(this.list);
    }

    static async handleInteraction(interaction: AutocompleteInteraction) {
        const focused = interaction.data.options.getFocused(true);
        if (focused === null) {
            throw new Error(`failed to find focused option for autocomplete interaction ${interaction.data.name}`);
        }
        const autocomplete = this.get(interaction.data.name, focused.name);
        assert(autocomplete, `failed to find valid handler for "${interaction.data.name}$${focused.name}" autocomplete`);
        await ("guildID" in interaction ? autocomplete.handleGuild(interaction, focused) : autocomplete.handleDM(interaction, focused));
    }

    static async loadAll(dir = thisDirectory) {
        if (dir === `${thisDirectory}/structure`) {
            return;
        }
        const files = (await readdir(dir, { withFileTypes: true }));
        for (const file of files) {
            if (file.isDirectory()) {
                await this.loadAll(`${dir}/${file.name}`);
                continue;
            }
            // ignore all files in base directory
            if (dir === thisDirectory) {
                continue;
            }
            Debug("autocomplete:load", `Loading "${`${dir}/${file.name}`.replace(thisDirectory, "").slice(1)}"`);
            const start = Timer.getTime();
            let inst: BaseAutocomplete;
            try {
                let autocomplete = await import(`${dir}/${file.name}`) as ModuleImport<typeof EmptyAutocomplete>;
                if ("default" in autocomplete) {
                    autocomplete = autocomplete.default;
                }
                inst = new autocomplete();
                [inst.id] = this.register(inst);
            } catch (err) {
                Logger.getLogger("LoadAutocomplete").error(`Failed to load autocomplete "${dir}/${file.name}":`, err);
                continue;
            }
            const end = Timer.getTime();
            Debug("autocomplete:load", `Loaded autocomplete "${inst.command}-${inst.option}" in ${Timer.calc(start, end, 3, false)}`);
        }
    }

    static register<T extends BaseAutocomplete>(autocomplete: T) {
        assert(this.get(autocomplete.command, autocomplete.option) === undefined, new Error(`duplicate component (cmd: ${autocomplete.command}, option: ${autocomplete.option || "null"})`).stack);
        const noOverride =
		// eslint-disable-next-line @typescript-eslint/dot-notation -- handle is protected
		autocomplete["handle"] === BaseAutocomplete.prototype["handle"] &&
		autocomplete.handleDM === BaseAutocomplete.prototype.handleDM &&
		autocomplete.handleGuild === BaseAutocomplete.prototype.handleGuild;
        if (noOverride) {
            throw new Error(`Autocomplete "${autocomplete.command}-${autocomplete.option}" does not override at least one handle method.`);
        }
        const id = this.list.push(autocomplete) - 1;
        Debug("autocomplete:register", `Registered autocomplete "${autocomplete.command}-${autocomplete.option}" (id: ${id})`);
        return [id] as [id: number];
    }
}
