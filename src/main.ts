import ClientEvent from "./util/ClientEvent";
import Logger from "./util/Logger";
import db from "./db";
import Category from "./util/cmd/Category";
import CommandHandler from "./util/cmd/CommandHandler";
import MessageCollector from "./util/MessageCollector";
import CheweyAPI from "./util/req/CheweyAPI";
import { Strings, Utility } from "@uwu-codes/utils";
import Eris, { ChatInputApplicationCommandStructure } from "eris";
import * as fs from "fs-extra";
import { Node } from "lavalink";
import ModLogHandler from "@util/handlers/ModLogHandler";
import YiffRocks from "yiff-rocks";
import AntiSpam from "@util/cmd/AntiSpam";
import ComponentInteractionCollector from "@util/ComponentInteractionCollector";
import Timer from "@util/Timer";
import fetch from "node-fetch";
import { RESTPostOAuth2ClientCredentialsResult } from "discord-api-types";
import { antiSpamDir, assetsDir, beta, bulkDeleteDir, commandsDir, dataDir, errorsDir, eventsDir, liteClientInfo, mainLogsDir, notesDir, tempDir, userAgent } from "@config";
import { performance } from "perf_hooks";
import util from "util";

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
		await db.init(true, true);
		await this.loadEvents();
		await this.loadCommands();
		MessageCollector.setClient(this);
		ComponentInteractionCollector.setClient(this);
		ModLogHandler.setClient(this);
		if (!beta) CheweyAPI.analytics.initAutoPosting(this);
		AntiSpam.init();
		YiffRocks.setUserAgent(userAgent);
		await this.connect();
	}

	dirCheck() {
		[
			dataDir,
			mainLogsDir,
			errorsDir,
			assetsDir,
			bulkDeleteDir,
			notesDir,
			tempDir,
			antiSpamDir
		].forEach((dir) => fs.mkdirpSync(dir));
	}

	async loadEvents() {
		const oStart = performance.now();
		if (!fs.existsSync(eventsDir)) throw new Error(`Events directory "${eventsDir}" does not exist.`);
		const list = await fs.readdir(eventsDir).then(v => v.map(ev => `${eventsDir}/${ev}`));
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
		if (!fs.existsSync(commandsDir)) throw new Error(`Commands directory "${commandsDir}" does not exist.`);
		const loadWhitelist: Array<string> | null = ["dev", "utility"];
		const list = await fs.readdir(commandsDir).then(v => v.map(ev => `${commandsDir}/${ev}`));
		for (const loc of list) {
			if (loadWhitelist !== null && !loadWhitelist.includes(loc.split("/").slice(-1)[0])) continue;
			const { default: cat } = (await import(loc)) as { default: Category; };
			CommandHandler.registerCategory(cat);
			CommandHandler.loadCategoryCommands(cat.name, cat.dir);
		}
		const end = performance.now();
		Logger.getLogger("CommandManager").debug(`Loaded ${CommandHandler.commands.length} commands in ${(end - start).toFixed(3)}ms`);
	}

	async getUser(id: string, forceRest = false) {
		const cur = this.users.get(id);
		if (cur && forceRest === false) return cur;
		const u = await this.getRESTUser(id).catch(() => null);
		if (u !== null) {
			if (forceRest && cur) this.users.remove(cur);
			this.users.add(u);
			return u;
		} else return null;
	}

	async getMember(guildId: string, userId: string, forceRest = false) {
		if (!this.guilds.has(guildId)) return this.getRESTGuildMember(guildId, userId).catch(() => null);
		else {
			const g = this.guilds.get(guildId)!;
			const cur = g.members.get(userId);
			if (cur && forceRest === false) return cur;
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

	async syncApplicationCommands(guild?: string, bypass = false) {
		const start = process.hrtime.bigint();
		const commands = CommandHandler.commands.reduce<Array<Eris.ApplicationCommandStructure>>((a, b) => a.concat(...b.applicationCommands), []);

		// due to not all categories being loaded before the help command
		((commands.find(cmd => cmd.name === "help")! as ChatInputApplicationCommandStructure).options![0] as Eris.ApplicationCommandOptionsString).choices = CommandHandler.categories.map(cat => {
			if (cat.restrictions.includes("disabled") || cat.restrictions.includes("developer") || (cat.restrictions.includes("beta") && !beta)) return;
			else return {
				name: cat.displayName.text,
				value: cat.name
			};
		}).filter(Boolean) as Eris.ApplicationCommandOptionWithChoices<never>["choices"];

		if (bypass !== true) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const v = (fs.existsSync(`${tempDir}/slash.json`) ? JSON.parse(fs.readFileSync(`${tempDir}/slash.json`).toString()) : []) as typeof commands;
			if (JSON.stringify(commands) === JSON.stringify(v)) {
				Logger.getLogger("SlashCommandSync").debug("Skipping sync due to no changes");
				return true;
			}
		}
		fs.writeFileSync(`${tempDir}/slash.json`, JSON.stringify(commands));

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
						Logger.getLogger("SlashCommandSync").debug(`Command at index "${index}": ${cmd.name} (type: ${Object.entries(Eris.Constants.ApplicationCommandTypes).find(([, v]) => cmd.type === v)![0]})`);
					});
					Logger.getLogger("SlashCommandSync").error(err);
					return false;
				}
			);
	}

	async syncLiteApplicationCommands(guild?: string, bypass = false) {
		const start = process.hrtime.bigint();
		const commands = [
			// since our help command is not stateless, we have to add a custom one
			{
				name: "help",
				description: "List my commands",
				options: []
			},
			...CommandHandler.commands.reduce<Array<Eris.ApplicationCommandStructure>>((a, b) => a.concat(...b.liteApplicationCommands), [])
		];

		if (bypass !== true) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const v = (fs.existsSync(`${tempDir}/slash-lite.json`) ? JSON.parse(fs.readFileSync(`${tempDir}/slash-lite.json`).toString()) : []) as typeof commands;
			if (JSON.stringify(commands) === JSON.stringify(v)) {
				Logger.getLogger("SlashCommandSync").debug("Skipping sync due to no changes");
				return true;
			}
		}
		fs.writeFileSync(`${tempDir}/slash-lite.json`, JSON.stringify(commands));

		const grant = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			body: "grant_type=client_credentials&scope=applications.commands.update",
			headers: {
				"Authorization": `Basic ${Buffer.from(`${liteClientInfo.id}:${liteClientInfo.secret}`).toString("base64")}`,
				"User-Agent": userAgent,
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});
		const token = await grant.json().then((v) => (v as RESTPostOAuth2ClientCredentialsResult).access_token);

		return fetch(`https://discord.com/api/v9/applications/${liteClientInfo.id}${guild === undefined ? "/commands" : `/guilds/${guild}/commands`}`, {
			method: "PUT",
			body: JSON.stringify(commands),
			headers: {
				"Authorization": `Bearer ${token}`,
				"User-Agent": userAgent,
				"Content-Type": "application/json"
			}
		})
			.then(async(res) => {
				const end = process.hrtime.bigint();
				Logger.getLogger("LiteSlashCommandSync").debug(`Synced ${commands.length} commands in ${Timer.calc(start, end, 2, false)}`);
				const body = await res.json();
				if (res.status >= 400) Logger.getLogger("LiteSlashCommandSync").error(util.inspect(body, { depth: null, colors: true }));
				return true;
			},
			(err: Error) => {
				Logger.getLogger("LiteSlashCommandSync").debug("Error detected, printing command index list");
				commands.forEach((cmd, index) => {
					Logger.getLogger("LiteSlashCommandSync").debug(`Command at index "${index}": ${cmd.name}`);
				});
				Logger.getLogger("LiteSlashCommandSync").error(err);
				return false;
			}
			);
	}
}
