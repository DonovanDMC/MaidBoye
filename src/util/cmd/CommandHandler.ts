/* eslint-disable @typescript-eslint/no-var-requires */
import type Category from "./Category.js";
import type Command from "./Command.js";
import type { CommandExport }  from "./Command.js";
import type { MessageCommand, UserCommand } from "./OtherCommand.js";
import Debug from "../Debug.js";
import Util from "../Util.js";
import Config from "../../config/index.js";
import Logger from "@uwu-codes/logger";
import { Strings, Timer } from "@uwu-codes/utils";
import { readdir } from "node:fs/promises";

export type CommandTypes = "default" | "user" | "message";
export default class CommandHandler {
    // optimization, traversing an array is slow
    private static categoryMap = new Map<string, Category>();
    private static commandMap = new Map<string, Command>();
    private static messageCommandMap = new Map<string, MessageCommand>();
    private static userCommandMap = new Map<string, UserCommand>();
    static categories = [] as Array<Category>;
    static get commands() {
        return this.categories.reduce<Array<Command>>((a,b) => a.concat(b.commands), []);
    }
    static get messageCommands() {
        return this.categories.reduce<Array<MessageCommand>>((a,b) => a.concat(b.messageCommands), []);
    }
    static get userCommands() {
        return this.categories.reduce<Array<UserCommand>>((a,b) => a.concat(b.userCommands), []);
    }

    static checkDuplicate(name: string): [true, string, Command | UserCommand | MessageCommand] | [false, null, null] {
        const dupCommand = this.commands.find(cmd => cmd.name === name);
        if (dupCommand) {
            return [true, name, dupCommand];
        }
        const dupUserCommand = this.userCommands.find(cmd => cmd.name === name);
        if (dupUserCommand) {
            return [true, name, dupUserCommand];
        }
        const dupMessageCommand = this.messageCommands.find(cmd => cmd.name === name);
        if (dupMessageCommand) {
            return [true, name, dupMessageCommand];
        }

        return [false, null, null];
    }

    static getCategory(name: string) {
        return this.categoryMap.get(name.toLowerCase()) ?? null;
    }

    static getCommand(type: "default", name: string): Command | null;
    static getCommand(type: "user", name: string): UserCommand | null;
    static getCommand(type: "message", name: string): MessageCommand | null;
    static getCommand(type: CommandTypes, name: string) {
        switch (type) {
            case "default": { return this.commandMap.get(name) ?? null;
            }
            case "user": { return this.userCommandMap.get(name) ?? null;
            }
            case "message": { return this.messageCommandMap.get(name) ?? null;
            }
        }
    }

    static async load(whitelistCategories: Array<string> = []) {
        let skippedCategories = 0;
        const start = Timer.getTime();
        if (!await Util.exists(Config.commandsDirectory)) {
            throw new Error(`Commands directory "${Config.commandsDirectory}" does not exist.`);
        }
        const loadWhitelist: Array<string> | null = null;
        const categories = (await readdir(Config.commandsDirectory)).map(cmd => `${Config.commandsDirectory}/${cmd}`);
        for (const category of categories) {
            if (whitelistCategories.length !== 0 && whitelistCategories.every(c => !category.endsWith(c))) {
                skippedCategories++;
                Logger.getLogger("CommandHandler").debug(`Skipping category "${category.split("/").pop()!}"`);
                continue;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            if (Config.isDevelopment && (Array.isArray(loadWhitelist) && !(loadWhitelist as Array<string>).includes(category.split("/").at(-1)!))) {
                continue;
            }
            const { default: cat } = (await import(`${category}/index.js`)) as { default: Category; };
            const c = CommandHandler.registerCategory(cat);
            await c.registerGeneric();
            await CommandHandler.loadCategoryCommands(cat.name, cat.dir);
        }
        const end = Timer.getTime();
        Logger.getLogger("CommandManager").debug(`Loaded ${CommandHandler.categories.length} categories (skipped: ${skippedCategories}) with ${CommandHandler.commands.length} commands in ${Timer.calc(start, end, 3, false)}`);
    }

    static async loadCategoryCommands(name: string, dir: string) {
        const cat = this.getCategory(name);
        if (!cat) {
            throw new Error(`Invalid category "${name}" provided in CommandHandler#loadCategoryCommands(${name}, ${dir})`);
        }
        let i = 0;
        for (const file of (await readdir(dir)).filter(v => !v.startsWith("index."))) {
            await this.registerExports(name, `${dir}/${file}`);
            i++;
        }
        Logger.getLogger("CommandHandler").debug(`Loaded ${i} ${Strings.plural("command", i)} into the category ${name} (dir: ${dir})`);
        return cat;
    }

    static registerCategory(cat: Category) {
        const dup = this.categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
        if (dup) {
            throw new Error(`Duplicate category name "${cat.name.toLowerCase()}" (${dup.dir})`);
        }
        Logger.getLogger("CommandHandler").info(`Registered the category "${cat.name}" (${cat.dir})`);
        this.categories.push(cat);
        this.categoryMap.set(cat.name, cat);
        return cat;
    }

    static async registerCommand(category: Category, file: string, command?: Command, userCommand?: UserCommand, messageCommand?: MessageCommand) {
        if (command) {
            const [dup, dupName, dupCmd] = this.checkDuplicate(command.name);
            if (dup) {
                throw new Error(`Duplicate application command name "${dupName}" for file "${file}" (dup: ${dupCmd.file}, type: interaction)`);
            }
            command.category = category.name;
            category.commands.push(command);
            this.commandMap.set(command.name, command);
            Debug("commands:register", `Registered the interaction command "${command.name}" (${file})`);
        }

        if (userCommand) {
            const [dup, dupName, dupCmd] = this.checkDuplicate(userCommand.name);
            if (dup) {
                throw new Error(`Duplicate application command name "${dupName}" for file "${file}" (dup: ${dupCmd.file}, type: user)`);
            }
            userCommand.category = category.name;
            category.userCommands.push(userCommand);
            this.userCommandMap.set(userCommand.name, userCommand);
            Debug("commands:register", `Registered the user command "${userCommand.name}" (${file})`);
        }

        if (messageCommand) {
            const [dup, dupName, dupCmd] = this.checkDuplicate(messageCommand.name);
            if (dup) {
                throw new Error(`Duplicate application command name "${dupName}" for file "${file}" (dup: ${dupCmd.file}, type: message)`);
            }
            messageCommand.category = category.name;
            category.messageCommands.push(messageCommand);
            this.messageCommandMap.set(messageCommand.name, messageCommand);
            Debug("commands:register", `Registered the message command "${messageCommand.name}" (${file})`);
        }
    }

    static async registerExports(category: string, file: string) {
        const cat = this.getCategory(category);
        if (!cat) {
            throw new Error(`Invalid category (${category}) provided for file "${file}"`);
        }
        const { default: command, userCommand, messageCommand } = await import(file) as CommandExport;

        if (!command && !userCommand && !messageCommand) {
            Logger.getLogger("CommandHandler").warn(`File "${file}" does not export any standard command-like objects.`);
            return;
        }

        await this.registerCommand(cat, file, command, userCommand, messageCommand);
    }

    static async reloadCategory(name: string) {
        const cat = this.removeCategory(name);
        this.registerCategory(await Util.import(cat.file));
    }

    static async reloadCommand(type: CommandTypes, name: string, log = true) {
        const cmd = this.removeCommand(type, name, log);
        await this.registerExports(cmd.category, cmd.file);
    }

    static removeCategory(name: string) {
        const cat = this.getCategory(name);
        if (!cat) {
            throw new Error(`Invalid category "${name}" provided in CommandHandler#removeCategory`);
        }
        this.categories.splice(this.categories.indexOf(cat), 1);
        this.categoryMap.delete(name);
        Logger.getLogger("CommandHandler").info(`Removed the category "${name}" (${cat.dir})`);
        return cat;
    }

    static removeCommand(type: CommandTypes, name: string, log = true) {
        const cmd = this.getCommand(type as "default", name);
        if (!cmd) {
            throw new Error(`Invalid category "${name}" provided in CommandHandler#removeCategory`);
        }
        this.commands.splice(this.commands.indexOf(cmd), 1);
        this.commandMap.delete(name);
        if (log) {
            Logger.getLogger("CommandHandler").info(`Removed the command "${name}" (${cmd.file})`);
        }
        return cmd;
    }
}
