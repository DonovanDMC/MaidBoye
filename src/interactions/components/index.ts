/// <reference path="../../util/@types/Oceanic.d.ts" />
import BaseComponent from "./structure/BaseComponent.js";
import type EmptyComponent from "./structure/Empty.js";
import { State } from "../../util/State.js";
import type { ComponentInteraction, ValidLocation } from "../../util/cmd/Command.js";
import Debug from "../../util/Debug.js";
import Logger from "../../util/Logger.js";
import ExceptionHandler from "../../util/handlers/ExceptionHandler.js";
import Config from "../../config/index.js";
import { Timer } from "@uwu-codes/utils";
import type { ModuleImport } from "@uwu-codes/types";
import { MessageFlags } from "oceanic.js";
import assert from "node:assert";
import { readdir } from "node:fs/promises";

const thisDirectory = new URL(".", import.meta.url).pathname.slice(0, -1);
export default class Components {
    private static list: Array<BaseComponent> = [];
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

    static async handleInteraction(interaction: ComponentInteraction) {
        const data = await State.fullDecode(interaction.data.customID);
        if (data.user && data.user !== interaction.user.id) {
            await interaction.reply({
                content: "H-hey! Run the command yourself if you want to control it..",
                flags:   MessageFlags.EPHEMERAL
            });
            return;
        }
        const component = this.get(data.command, data.action);
        Logger.getLogger("Components").debug(`Handling component "${data.command || "null"}$${data.action}" for user ${interaction.user.tag} (${interaction.user.id}) in guild ${"guildID" in interaction ? interaction.guildID : "DM"}`);
        assert(component, `failed to find valid handler for "${data.command || "null"}$${data.action}" component`);
        await ("guildID" in interaction ? component.handleGuild(interaction as ComponentInteraction<ValidLocation.GUILD>, data) : component.handleDM(interaction as ComponentInteraction<ValidLocation.PIVATE>, data))
            .catch(async err => {
                const code =  await ExceptionHandler.handle(err as Error, "component", [
                    `User: **${interaction.user.tag}** (${interaction.user.id})`,
                    `Guild: **${interaction.inCachedGuildChannel() ? interaction.guild.name : "DM"}** (${"guildID" in interaction ? interaction.guildID : "DM"})`,
                    `Channel: **${interaction.channel && "name" in interaction.channel ? interaction.channel.name : "DM"}** (${interaction.channelID})`,
                    `Command: **${data.command || "null"}**`,
                    `Data: \`\`\`json\n${JSON.stringify(data, null, 2)}\`\`\``
                ].join("\n"));
                await interaction.reply({
                    content: `H-hey! Something went wrong while executing that command..\nYou can try again, or report it to one of my developers.\n\nCode: \`${code}\`\nSupport Server: <${Config.discordLink}>`,
                    flags:   MessageFlags.EPHEMERAL
                });
            });
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
            Debug("components:load", `Loading "${`${dir}/${file.name}`.replace(thisDirectory, "").slice(1)}"`);
            const start = Timer.getTime();
            let inst: BaseComponent;
            try {
                let component = await import(`${dir}/${file.name}`) as ModuleImport<typeof EmptyComponent>;
                if ("default" in component) {
                    component = component.default;
                }
                inst = new component();
                [inst.id] = this.register(inst);
            } catch (err) {
                Logger.getLogger("LoadComponents").error(`Failed to load component "${dir}/${file.name}":`, err);
                continue;
            }
            const end = Timer.getTime();
            Debug("components:load", `Loaded component "${inst.command || "null"}-${inst.action}" in ${Timer.calc(start, end, 3, false)}`);
        }
    }

    static register<T extends BaseComponent>(component: T) {
        assert(this.get(component.command, component.action) === undefined, new Error(`duplicate component (cmd: ${component.command || "null"}, action: ${component.action})`).stack);
        const noOverride =
		// eslint-disable-next-line @typescript-eslint/dot-notation -- handle is protected
		component["handle"] === BaseComponent.prototype["handle"] &&
		component.handleDM === BaseComponent.prototype.handleDM &&
		component.handleGuild === BaseComponent.prototype.handleGuild;
        if (noOverride) {
            throw new Error(`Component "${component.command || "null"}-${component.action}" does not override at least one handle method.`);
        }
        const id = this.list.push(component) - 1;
        Debug("components:register", `Registered component "${component.command || "null"}-${component.action}" (id: ${id})`);
        return [id] as [id: number];
    }
}
