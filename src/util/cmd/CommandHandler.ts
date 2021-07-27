/* eslint-disable @typescript-eslint/no-var-requires */
import Category from "./Category";
import Command from "./Command";
import Logger from "../Logger";
import * as fs from "fs-extra";
import { Strings } from "@uwu-codes/utils";

export default class CommandHandler {
	// optimization, traversing an array is slow
	private static commandMap = new Map<string, Command>();
	private static categoryMap = new Map<string, Category>();
	static categories = [] as Array<Category>;
	static get commands() { return this.categories.reduce<Array<Command>>((a,b) => a.concat(b.commands), []); }
	static get triggers() { return this.commands.reduce<Array<string>>((a,b) => a.concat(b.triggers), []); }

	static registerCategory(d: Category) {
		const dup = this.categories.find(c => c.name.toLowerCase() === d.name.toLowerCase());
		if (dup) throw new Error(`Duplicate category name "${d.name.toLowerCase()}" (${dup.dir})`);
		Logger.getLogger("CommandHandler").info(`Registered the category "${d.name}" (${d.dir})`);
		this.categories.push(d);
		this.categoryMap.set(d.name, d);
		return d;
	}
	static getCategory(name: string) { return this.categoryMap.get(name.toLowerCase()) ?? null; }
	static removeCategory(name: string) {
		const cat = this.getCategory(name);
		if (!cat) throw new Error(`Invalid category "${name}" provided in CommandHandler#removeCategory`);
		this.categories.splice(this.categories.indexOf(cat), 1);
		this.categoryMap.delete(name);
		delete require.cache[require.resolve(cat.file)];
		Logger.getLogger("CommandHandler").info(`Removed the category "${name}" (${cat.dir})`);
		return cat;
	}
	static reloadCategory(name: string) {
		const cat = this.getCategory(name);
		if (!cat) throw new Error(`Invalid category "${name}" provided in CommandHandler#reloadCategory`);
		this.removeCategory(name);
		cat.commands.forEach(cmd => delete require.cache[require.resolve(cmd.file)]);
		const { default: newCat } = (require(cat.file) as { default: Category; });
		this.registerCategory(newCat);
		this.loadCategoryCommands(name, newCat.dir);
		return newCat;
	}
	static loadCategoryCommands(name: string, dir: string) {
		const cat = this.getCategory(name);
		if (!cat) throw new Error(`Invalid category "${name}" provided in CommandHandler#loadCategoryCommands(${name}, ${dir})`);
		let i = 0;
		fs.readdirSync(dir).filter(v => !v.startsWith("index.")).forEach(p => {
			const { default: cmd } = (require(`${dir}/${p}`) as { default: Command; });
			this.registerCommand(name, cmd, false);
			i++;
		});
		Logger.getLogger("CommandHandler").info(`Loaded ${i} ${Strings.plural("command", i)} into the category ${name} (dir: ${dir})`);
		return cat;
	}

	static registerCommand(cat: string, d: Command, log = true) {
		if (d.triggers === undefined || d.triggers.length === 0) throw new Error(`Command provided (${d.file || "Unknown"}) has undefined or 0 triggers.`);
		const ctg = this.getCategory(cat);
		if (!ctg) throw new Error(`Invalid category "${cat}" specified when registering the command ${d.triggers[0]} (${d.file})`);
		if (!fs.existsSync(d.file)) throw new Error(`Failed to determine the file location for the command "${d.triggers[0]}" (cat: ${cat}, dir: ${ctg.dir})`);
		const dup = this.triggers.find(t => d.triggers.some(tr => t.includes(tr)));
		const dupCmd = (dup && this.commands.find(c => c.triggers.includes(dup))) || undefined;
		if (dup && dupCmd) throw new Error(`Duplicate commands trigger "${dup}" for command ${d.triggers[0]} (${d.file}) on command ${dupCmd.triggers[0]} (${dupCmd.file})`);
		if (log) Logger.getLogger("CommandHandler").info(`Registered the command "${d.triggers[0]}" (${d.file})`);
		ctg.commands.push(d);
		d.category = cat;
		d.triggers.forEach(t => this.commandMap.set(t, d));
		return d;
	}
	static getCommand(cmd: string) { return this.commandMap.get(cmd) ?? null; }
	static removeCommand(d: string, log = true) {
		const cmd = this.getCommand(d);
		if (!cmd) throw new Error(`Invalid command "${d}" provided in CommandHandler#removeCommand`);
		this.commands.splice(this.commands.indexOf(cmd), 1);
		delete require.cache[require.resolve(cmd.file)];
		cmd.triggers.forEach(t => this.commandMap.delete(t));
		if (log) Logger.getLogger("CommandHandler").info(`Removed the command "${d}" (${cmd.file})`);
		return cmd;
	}
	static reloadCommand(d: string, log = true) {
		const cmd = this.getCommand(d);
		if (!cmd) throw new Error(`Invalid command "${d}" provided in CommandHandler#reloadCommand`);
		this.removeCommand(d, log);
		const { default: newCmd } = (require(cmd.file) as { default: Command; });
		this.registerCommand(cmd.category, newCmd, log);
		return newCmd;
	}
}
