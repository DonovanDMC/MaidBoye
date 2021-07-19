import ClientEvent from "./util/ClientEvent";
import config from "./config";
import Logger from "./util/Logger";
import WebhookStore from "./util/WebhookStore";
import db from "./db";
import Category from "./util/cmd/Category";
import CommandHandler from "./util/cmd/CommandHandler";
import MessageCollector from "./util/MessageCollector";
import { Strings, Utility } from "@uwu-codes/utils";
import Eris from "eris";
import * as fs from "fs-extra";
import { Node } from "lavalink";
import ModLogHandler from "@util/handlers/ModLogHandler";
import { performance } from "perf_hooks";


export default class MaidBoye extends Eris.Client {
	events = new Map<string, ClientEvent>();
	cpuUsage = 0;
	firstReady = false;
	lava: Node;
	constructor(token: string, options: Eris.ClientOptions) {
		super(token, options);
	}

	async launch() {
		WebhookStore.setClient(this);
		await db.init(true, true);
		await this.loadEvents();
		await this.loadCommands();
		MessageCollector.setClient(this);
		ModLogHandler.setClient(this);
		await this.connect();
	}

	async loadEvents() {
		const oStart = performance.now();
		if (!fs.existsSync(config.dir.events)) throw new Error(`Events directory "${config.dir.events}" does not exist.`);
		const list = await fs.readdir(config.dir.events).then(v => v.map(ev => `${config.dir.events}/${ev}`));
		Logger.getLogger("EventManager").debug(`Got ${list.length} ${Strings.plural("event", list)} to load`);
		for (const loc of list) {
			const start = performance.now();
			let event = await import(loc) as ClientEvent | { default: ClientEvent; };
			if ("default" in event) event = event.default;
			if (!Utility.isOfType(event, ClientEvent)) throw new TypeError(`Export of event file "${loc}" is not an instance of ClientEvent.`);
			this.events.set(event.name, event);
			this.on(event.name, event.listener.bind(this));
			const end = performance.now();
			Logger.getLogger("EventManager").debug(`Loaded the ${event.name} event in ${(end - start).toFixed(3)}ms`);
		}
		const oEnd = performance.now();
		Logger.getLogger("EventManager").debug(`Loaded ${list.length} ${Strings.plural("event", list)} in ${(oEnd - oStart).toFixed(3)}ms`);
	}

	async loadCommands() {
		const start = performance.now();
		if (!fs.existsSync(config.dir.commands)) throw new Error(`Commands directory "${config.dir.commands}" does not exist.`);
		const list = await fs.readdir(config.dir.commands).then(v => v.map(ev => `${config.dir.commands}/${ev}`));
		for (const loc of list) {
			const { default: cat } = (await import(loc)) as { default: Category; };
			CommandHandler.registerCategory(cat);
			CommandHandler.loadCategoryCommands(cat.name, cat.dir);
		}
		const end = performance.now();
		Logger.getLogger("CommandManager").debug(`Loaded ${CommandHandler.commands.length} commands in ${(end - start).toFixed(3)}ms`);
	}

	async getUser(id: string) {
		if (this.users.has(id)) return this.users.get(id)!;
		const u = await this.getRESTUser(id).catch(() => null);
		if (u !== null) {
			this.users.add(u);
			return u;
		} else return null;
	}
}
