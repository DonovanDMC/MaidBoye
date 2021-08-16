import config from "./config";
import { Telegraf } from "telegraf"
import Logger from "./util/Logger";
import * as fs from "fs/promises";
import { ModuleImport } from "@uwu-codes/types";
import Command from "./util/Command";

export default class MaidBoye extends Telegraf {
	commands = new Map<string, Command>();
	constructor() {
		super(config.token);
		this.catch((err, ctx) => {	
			if(err instanceof Error && err.constructor.name === "TimeoutError") throw err;
			Logger.getLogger("ErrorHandler").error(err);
		});
	}
	
	async loadCommands() {
		const cmds = await fs.readdir(`${__dirname}/commands`);
		for(const file of cmds) {
			const { default: cmd } = await import(`${__dirname}/commands/${file}`) as ModuleImport<Command>;
			this.command(cmd.command, cmd.handlers[0], ...cmd.handlers.slice(1));
			(!Array.isArray(cmd.command) ? [cmd.command] : cmd.command).forEach(name => this.commands.set(name, cmd));
		}
	}

	async launch() {
		await this.loadCommands();
		await super.launch.call(this);
		console.log(`Ready As ${this.botInfo === undefined ? "Unknown" : `${this.botInfo.first_name} (@${this.botInfo.username}, ${this.botInfo.id})`}`);
	}
}
