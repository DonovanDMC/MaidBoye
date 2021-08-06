import ClientEvent from "./util/ClientEvent";
import config from "./config";
import Logger from "./util/Logger";
import WebhookStore from "./util/WebhookStore";
import db from "./db";
import Category from "./util/cmd/Category";
import CommandHandler from "./util/cmd/CommandHandler";
import MessageCollector from "./util/MessageCollector";
import CheweyAPI from "./util/req/CheweyAPI";
import { Strings, Utility } from "@uwu-codes/utils";
import Eris from "eris";
import * as fs from "fs-extra";
import { Node } from "lavalink";
import ModLogHandler from "@util/handlers/ModLogHandler";
import YiffRocks from "yiff-rocks";
import AntiSpam from "@util/cmd/AntiSpam";
import ComponentInteractionCollector from "@util/ComponentInteractionCollector";
import Timer from "@util/Timer";
import fetch from "node-fetch";
import { RESTPostOAuth2ClientCredentialsResult } from "discord-api-types";
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
		this.dirCheck();
		WebhookStore.setClient(this);
		await db.init(true, true);
		await this.loadEvents();
		await this.loadCommands();
		MessageCollector.setClient(this);
		ComponentInteractionCollector.setClient(this);
		ModLogHandler.setClient(this);
		if (!config.beta) CheweyAPI.analytics.initAutoPosting(this);
		AntiSpam.init();
		YiffRocks.setUserAgent(config.userAgent);
		await this.connect();
	}

	dirCheck(obj?: Record<string, string | Record<string, string>>) {
		Object.entries(obj ?? config.dir).forEach(([key, dir]) => {
			if (["src", "config", "commands", "events"].includes(key)) return;
			if (typeof dir === "object") this.dirCheck(dir);
			else fs.mkdirpSync(dir);
		});
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

	async getUser(id: string, force = false) {
		const cur = this.users.get(id);
		if (cur && force === false) return cur;
		const u = await this.getRESTUser(id).catch(() => null);
		if (u !== null) {
			if (force && cur) this.users.remove(cur);
			this.users.add(u);
			return u;
		} else return null;
	}

	async getMember(guildId: string, userId: string, force = false) {
		if (!this.guilds.has(guildId)) return this.getRESTGuildMember(guildId, userId).catch(() => null);
		else {
			const g = this.guilds.get(guildId)!;
			const cur = g.members.get(userId);
			if (cur && force === false) return cur;
			else {
				const m = await g.getRESTMember(userId).catch(() => null);
				if (m !== null) {
					// if (force && cur) g.members.remove(cur);
					g.members.add(m, g);
					return m;
				} else return null;
			}
		}
	}

	async syncSlashCommands(guild?: string, bypass = false) {
		const start = process.hrtime.bigint();
		const commands = CommandHandler.commands.filter(c => c.hasSlashVariant).map(cmd => ({
			name: cmd.triggers[0],
			description: cmd.description,
			options: cmd.slashCommandOptions
		}));

		// due to not all categories being loaded before the help command
		commands.find(cmd => cmd.name === "help")!.options[0].choices = CommandHandler.categories.map(cat => {
			if (cat.restrictions.includes("disabled") || cat.restrictions.includes("developer") || (cat.restrictions.includes("beta") && !config.beta)) return;
			else return {
				name: cat.displayName.text,
				value: cat.name
			};
		}).filter(Boolean) as Eris.SlashCommandOptions["choices"];

		if (bypass !== true) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const v = (fs.existsSync(`${config.dir.temp}/slash.json`) ? JSON.parse(fs.readFileSync(`${config.dir.temp}/slash.json`).toString()) : []) as typeof commands;
			if (JSON.stringify(commands) === JSON.stringify(v)) {
				Logger.getLogger("SlashCommandSync").debug("Skipping sync due to no changes");
				return true;
			}
		}
		fs.writeFileSync(`${config.dir.temp}/slash.json`, JSON.stringify(commands));

		return (guild === undefined ? this.bulkEditCommands(commands) : this.bulkEditGuildCommands(guild, commands))
			.then(
				({ length }) => {
					const end = process.hrtime.bigint();
					Logger.getLogger("SlashCommandSync").debug(`Synced ${length} commands in ${Timer.calc(start, end, 2, false)}`);
					return true;
				},
				(err: Error) => {
					Logger.getLogger("SlashCommandSync").debug("Error detected, printing command index list");
					commands.forEach((cmd, index) => {
						Logger.getLogger("SlashCommandSync").debug(`Command at index "${index}": ${cmd.name}`);
					});
					Logger.getLogger("SlashCommandSync").error(err);
					return false;
				}
			);
	}

	async syncLiteSlashCommands(guild?: string, bypass = false) {
		const start = process.hrtime.bigint();
		const commands = [
			// since our help command is not stateless, we have to add a custom one
			{
				name: "help",
				description: "List my commands",
				options: []
			},
			...CommandHandler.commands.filter(c => c.hasSlashVariant === "lite").map(cmd => ({
				name: cmd.triggers[0],
				description: cmd.description,
				options: cmd.slashCommandOptions
			}))
		];

		if (bypass !== true) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const v = (fs.existsSync(`${config.dir.temp}/slash-lite.json`) ? JSON.parse(fs.readFileSync(`${config.dir.temp}/slash-lite.json`).toString()) : []) as typeof commands;
			if (JSON.stringify(commands) === JSON.stringify(v)) {
				Logger.getLogger("SlashCommandSync").debug("Skipping sync due to no changes");
				return true;
			}
		}
		fs.writeFileSync(`${config.dir.temp}/slash-lite.json`, JSON.stringify(commands));

		const grant = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			body: "grant_type=client_credentials&scope=applications.commands.update",
			headers: {
				"Authorization": `Basic ${Buffer.from(`${config.client.lite.id}:${config.client.lite.secret}`).toString("base64")}`,
				"User-Agent": config.userAgent,
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});
		const token = await grant.json().then((v: RESTPostOAuth2ClientCredentialsResult) => v.access_token);

		return fetch(`https://discord.com/api/v9/applications/${config.client.lite.id}${guild === undefined ? "/commands" : `/guilds/${guild}/commands`}`, {
			method: "POST",
			body: JSON.stringify(commands),
			headers: {
				"Authorization": `Bearer ${token}`,
				"User-Agent": config.userAgent,
				"Content-Type": "application/json"
			}
		})
			.then(() => {
				const end = process.hrtime.bigint();
				Logger.getLogger("SlashCommandSync").debug(`Synced ${commands.length} commands in ${Timer.calc(start, end, 2, false)}`);
				return true;
			},
			(err: Error) => {
				Logger.getLogger("SlashCommandSync").debug("Error detected, printing command index list");
				commands.forEach((cmd, index) => {
					Logger.getLogger("SlashCommandSync").debug(`Command at index "${index}": ${cmd.name}`);
				});
				Logger.getLogger("SlashCommandSync").error(err);
				return false;
			}
			);
	}
}
