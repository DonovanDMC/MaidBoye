/// <reference path="../../util/@types/Oceanic.d.ts" />
import BaseModal from "./structure/BaseModal.js";
import type EmptyModal from "./structure/Empty.js";
import type { ModalSubmitInteraction } from "../../util/cmd/Command.js";
import Debug from "../../util/Debug.js";
import Logger from "../../util/Logger.js";
import { State } from "../../util/State.js";
import { assert } from "tsafe";
import { Timer } from "@uwu-codes/utils";
import { MessageFlags } from "oceanic.js";
import type { ModuleImport } from "@uwu-codes/types";
import { readdir } from "node:fs/promises";

const thisDirectory = new URL(".", import.meta.url).pathname.slice(0, -1);
export default class Modals {
    private static list: Array<BaseModal> = [];
    static findIndex(cmd: string | null, action: string) {
        return this.list.findIndex(val => val.command === cmd && val.action === action);
    }

    static get(cmd: string | null, action: string) {
        // this isn't using an actual array
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        return this.list[this.findIndex(cmd, action)];
    }

    static getAll() {
        return Array.from(this.list);
    }

    static async handleInteraction(interaction: ModalSubmitInteraction) {
        const data = await State.fullDecode(interaction.data.customID);
        if (data.user && data.user !== interaction.user.id) {
            await interaction.reply({
                content: "H-hey! Run the command yourself if you want to control it..",
                flags:   MessageFlags.EPHEMERAL
            });
            return;
        }
        const components: Record<string, string | undefined> = {};
        for (const row of interaction.data.components) {
            for (const component of row.components) {
                components[component.customID] = component.value;
            }
        }
        const modal = this.get(data.command, data.action);
        assert(modal, `failed to find valid handler for "${data.command || "null"}$${data.action}" modal`);
        await ("guildID" in interaction ? modal.handleGuild(interaction, components, data) : modal.handleDM(interaction, components, data));
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
            Debug("modals:load", `Loading "${`${dir}/${file.name}`.replace(thisDirectory, "").slice(1)}"`);
            const start = Timer.getTime();
            let inst: BaseModal;
            try {
                let modal = await import(`${dir}/${file.name}`) as ModuleImport<typeof EmptyModal>;
                if ("default" in modal) {
                    modal = modal.default;
                }
                inst = new modal();
                [inst.id] = this.register(inst);
            } catch (err) {
                Logger.getLogger("LoadModals").error(`Failed to load modal "${dir}/${file.name}":`, err);
                continue;
            }
            const end = Timer.getTime();
            Debug("modals:load", `Loaded modal "${inst.command || "null"}-${inst.action}" in ${Timer.calc(start, end, 3, false)}`);
        }
    }

    static register<T extends BaseModal>(modal: T) {
        assert(this.get(modal.command, modal.action) === undefined, new Error(`duplicate modal (cmd: ${modal.command || "null"}, action: ${modal.action})`).stack);
        const noOverride =
		// eslint-disable-next-line @typescript-eslint/dot-notation -- handle is protected
		modal["handle"] === BaseModal.prototype["handle"] &&
		modal.handleDM === BaseModal.prototype.handleDM &&
		modal.handleGuild === BaseModal.prototype.handleGuild;
        if (noOverride) {
            throw new Error(`Modal "${modal.command || "null"}-${modal.action}" does not override at least one handle method.`);
        }
        const id = this.list.push(modal) - 1;
        Debug("modals:register", `Registered modal "${modal.command || "null"}-${modal.action}" (id: ${id})`);
        return [id] as [id: number];
    }
}
