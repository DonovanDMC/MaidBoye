import Config from "./config/index.js";
import Util from "./util/Util.js";
import ClientEvent from "./util/ClientEvent.js";
import Logger from "./util/Logger.js";
import CommandHandler from "./util/cmd/CommandHandler.js";
import api from "./api/index.js";
import { ApplicationCommandTypeNames } from "./util/Names.js";
import WebhookHandler from "./util/handlers/WebhookHandler.js";
import { Strings, Timer } from "@uwu-codes/utils";
import type { ModuleImport } from "@uwu-codes/types";
import {
    type AnyGuildChannel,
    type AnyThreadChannel,
    ApplicationCommandTypes,
    type CreateApplicationCommandOptions,
    type RawThreadChannel,
    type TypedCollection,
    Client,
    ThreadChannel
} from "oceanic.js";
import {
    access,
    mkdir,
    readdir,
    readFile,
    writeFile
} from "node:fs/promises";

export default class MaidBoye extends Client {
    static INSTANCE: MaidBoye;
    cpuUsage = 0;
    events = new Map<string, ClientEvent>();
    firstReady = false;
    initTime = 0n;
    presenceUpdateInterval: NodeJS.Timeout | null = null;
    readyTime = 0n;
    server: typeof api;
    constructor(initTime: bigint) {
        super(Config.clientOptions);
        MaidBoye.INSTANCE = this;
        this.initTime = initTime;
        this.presenceUpdateInterval = null;
    }

    async dirCheck() {
        const directories = [
            Config.logsDirectory,
            Config.dataDir,
            Config.eventsDirectory,
            Config.commandsDirectory
        ];
        for (const dir of directories) {
            await mkdir(dir, { recursive: true });
        }
    }

    async getCommandIDMap(): Promise<Record<"chatInput" | "message" | "user", Record<string, string>>> {
        const idMap = await access(`${Config.dataDir}/id-map.json`).then(async() => readFile(`${Config.dataDir}/id-map.json`, "utf8")).catch(() => null);
        if (idMap === null) {
            await this.registerCommands();
            return this.getCommandIDMap();
        }
        return JSON.parse(idMap) as Record<"chatInput" | "message" | "user", Record<string, string>>;
    }

    async getGuildChannel<CH extends AnyGuildChannel = AnyGuildChannel>(id: string, forceRest = false) {
        const ch = this.getChannel(id) as CH;
        if (!ch || forceRest) {
            const channel = await this.rest.channels.get(id).catch(() => null) as CH | null;
            if (channel === null || !("guild" in channel)) {
                return null;
            }
            const guild = this.guilds.get(channel.guild.id);
            if (guild) {
                if (channel instanceof ThreadChannel) {
                    guild.threads.add(channel);
                    this.threadGuildMap[channel.id] = guild.id;
                    const parent = await this.getGuildChannel(channel.parentID);
                    if (parent && "threads" in parent) {
                        (parent.threads as TypedCollection<string, RawThreadChannel, AnyThreadChannel>).add(channel);
                    }
                } else {
                    guild.channels.add(channel);
                    this.channelGuildMap[channel.id] = guild.id;
                }
            }
            return channel;
        } else {
            return ch;
        }
    }

    async getMember(guildID: string, userID: string, forceRest = false) {
        if (this.guilds.has(guildID)) {
            const guild = this.guilds.get(guildID)!;
            const current = guild.members.get(userID);
            return current && forceRest === false ? current : guild.fetchMembers({ userIDs: [userID] }).then(([member]) => member).catch(() => null);
        } else {
            return this.rest.guilds.getMember(guildID, userID).catch(() => null);
        }
    }

    async getUser(id: string, forceRest = false) {
        const current = this.users.get(id);
        if (current && !forceRest) {
            return current;
        }
        return this.rest.users.get(id).catch(() => null);
    }

    async handleRegistrationError(commands: Array<CreateApplicationCommandOptions>, err: Error) {
        Logger.getLogger("CommandRegistration").error("Failed To Register Commands:", err);
        for (const cmd of commands) {
            Logger.getLogger("CommandRegistration").error(`Command At ${commands.indexOf(cmd)}: ${cmd.name} (${ApplicationCommandTypeNames[cmd.type]})`);
        }

        return [];
    }

    async launch() {
        await this.dirCheck();
        await this.loadEvents();
        await CommandHandler.load();
        await WebhookHandler.init(this);
        /* register commands in ready event */
        return this.connect();
    }

    async loadEvents() {
        const overallStart = Timer.getTime();
        if (!await Util.exists(Config.eventsDirectory))  {
            throw new Error(`Events directory "${Config.eventsDirectory}" does not exist.`);
        }
        const events = (await readdir(Config.eventsDirectory, { withFileTypes: true })).filter(ev => ev.isFile()).map(ev => `${Config.eventsDirectory}/${ev.name}`);
        for (const event of events) {
            const start = Timer.getTime();
            let ev = await import(event) as ModuleImport<ClientEvent>;
            if ("default" in ev) {
                ev = ev.default;
            }
            if (!(ev instanceof ClientEvent)) {
                throw new TypeError(`Export of event file "${event}" is not an instance of ClientEvent.`);
            }
            this.events.set(ev.name, ev);
            this.on(ev.name, ev.listener.bind(this));
            const end = Timer.getTime();
            Logger.getLogger("EventManager").debug(`Loaded the ${ev.name} event in ${Timer.calc(start, end, 3, false)}`);
        }
        const overallEnd = Timer.getTime();
        Logger.getLogger("EventManager").debug(`Loaded ${events.length} ${Strings.plural("event", events)} in ${Timer.calc(overallStart, overallEnd, 3, false)}`);
    }

    async registerCommands() {
        const commands = [
            ...CommandHandler.commands.map(cmd => cmd.toJSON()),
            ...CommandHandler.userCommands.map(cmd => cmd.toJSON()),
            ...CommandHandler.messageCommands.map(cmd => cmd.toJSON())
        ];
        const cached = await access(`${Config.dataDir}/commands.json`).then(async() => readFile(`${Config.dataDir}/commands.json`, "utf8")).catch(() => "[]");
        const idMap = await access(`${Config.dataDir}/id-map.json`).then(async() => JSON.parse(await readFile(`${Config.dataDir}/id-map.json`, "utf8")) as Record<"chatInput" | "message" | "user", Record<string, string>>).catch(() => ({ chatInput: {}, message: {}, user: {} }) as Record<"chatInput" | "message" | "user", Record<string, string>>);
        let needsIDMapUpdate = false;
        outer: for (const cmd of commands) {
            switch (cmd.type) {
                case ApplicationCommandTypes.CHAT_INPUT: {
                    if (!idMap.chatInput[cmd.name]) {
                        needsIDMapUpdate = true;
                        break outer;
                    }
                    break;
                }

                case ApplicationCommandTypes.MESSAGE: {
                    if (!idMap.message[cmd.name]) {
                        needsIDMapUpdate = true;
                        break outer;
                    }
                    break;
                }

                case ApplicationCommandTypes.USER: {
                    if (!idMap.user[cmd.name]) {
                        needsIDMapUpdate = true;
                        break outer;
                    }

                    break;
                }
            }
        }
        if (!needsIDMapUpdate && JSON.stringify(commands) === cached) {
            Logger.getLogger("CommandRegistration").debug("Commands are up to date, skipping registration.");
            return;
        }
        writeFile(`${Config.dataDir}/commands.json`, JSON.stringify(commands), "utf8").catch(() => null);
        const regStart = Timer.getTime();
        const cmds = await (Config.useGuildCommands ? this.application.bulkEditGuildCommands(Config.developmentGuild, commands).catch(this.handleRegistrationError.bind(this, commands)) : this.application.bulkEditGlobalCommands(commands).catch(this.handleRegistrationError.bind(this, commands)));
        idMap.chatInput = {};
        idMap.message = {};
        idMap.user = {};
        for (const cmd of cmds) {
            switch (cmd.type) {
                case ApplicationCommandTypes.CHAT_INPUT: {
                    idMap.chatInput[cmd.name] = cmd.id;
                    break;
                }

                case ApplicationCommandTypes.MESSAGE: {
                    idMap.message[cmd.name] = cmd.id;
                    break;
                }

                case ApplicationCommandTypes.USER: {
                    idMap.user[cmd.name] = cmd.id;
                    break;
                }
            }
        }
        await writeFile(`${Config.dataDir}/id-map.json`, JSON.stringify(idMap), "utf8").catch(() => null);
        const regEnd = Timer.getTime();
        Logger.getLogger("CommandRegistration").info(`Registered ${commands.length} commands in ${Timer.calc(regStart, regEnd, 3, false)}`);
        await this.updateBotlistCommands(commands);
    }

    async startAPIServer() {
        return new Promise<void>(resolve => {
            (this.server = api).listen(Config.apiPort, Config.apiListener,  () => {
                Logger.getLogger("API").info(`API listening on ${Config.apiHost}:${Config.apiPort} (${Config.apiURL})`);
                resolve();
            });
        });
    }

    async updateBotlistCommands(commands: Array<CreateApplicationCommandOptions>) {
        await fetch(`https://discordbotlist.com/api/v1/bots/${Config.clientID}/commands`, {
            method:  "POST",
            headers: {
                "Authorization": Config.botLists["discordbotlist.com"],
                "Content-Type":  "application/json"
            },
            body: JSON.stringify(commands)
        });
    }
}
