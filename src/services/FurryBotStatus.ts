import Config from "../config/index.js";
import Service, { NOT_HANDLED } from "../util/Service.js";
import ServicesManager from "../util/ServicesManager.js";
import Logger from "@uwu-codes/logger";
import { ActivityTypes, Client } from "oceanic.js";
import { memoryUsage } from "node:process";

export default class FurryBotStatusService extends Service {
    furrybot: Client;
    furrybotBeta: Client;
    constructor(file: string, name: string) {
        super(file, name);
        void this.init();
    }

    static register() {
        if (Config.isDevelopment) {
            Logger.getLogger("FurryBotStatusService").info("Not registering FurryBotStatusService in development mode.");
        } else {
            return ServicesManager.register("furry-bot-status", import.meta.url, 120000, false); // starting 6 shards takes a bit of time, longer than 30 seconds
        }
    }

    protected override async handleMessage(op: string, data: unknown, from: string) {
        const r = await super.handleMessage(op, data, from);
        if (r !== NOT_HANDLED) {
            return r;
        }

        if (op === "STATS") {
            return memoryUsage();
        }

        throw new Error(`Not Implemented: [OP:${op}]`);
    }

    async init() {
        // init FurryBot
        await new Promise<void>(resolve => {
            void (this.furrybot = new Client({
                auth:    `Bot ${Config.furrybotToken}`,
                gateway: {
                    intents:   0,
                    maxShards: 6,
                    presence:  {
                        status:     "dnd",
                        activities: [{
                            type: ActivityTypes.WATCHING,
                            name: "Visit https://maidboye.cafe"
                        }]
                    }
                },
                disableCache: "no-warning"
            })
                .on("shardReady", shard => Logger.getLogger("FurryBotStatusService | FurryBot").info(`Shard ${shard} is ready!`))
                .on("shardDisconnect", (error, shard) => Logger.getLogger("FurryBotStatusService | FurryBot").warn(`Shard ${shard} disconnected.`))
                .once("ready", () => {
                    resolve();
                    Logger.getLogger("FurryBotStatusService | FurryBot").info("Ready!");
                    setInterval(async() => {
                        await this.furrybot.editStatus("dnd", [{
                            type: ActivityTypes.WATCHING,
                            name: "Visit https://maidboye.cafe"
                        }]);
                    }, 6e4);
                })).connect();
        });
        // init FurryBotBeta
        await new Promise<void>(resolve => {
            void (this.furrybotBeta = new Client({
                auth:    `Bot ${Config.furrybotBetaToken}`,
                gateway: {
                    intents:   0,
                    maxShards: 1,
                    presence:  {
                        status:     "dnd",
                        activities: [{
                            type: ActivityTypes.WATCHING,
                            name: "Visit https://maidboye.cafe"
                        }]
                    }
                },
                disableCache: "no-warning"
            })
                .on("shardReady", shard => Logger.getLogger("FurryBotStatusService | FurryBotBeta").info(`Shard ${shard} is ready!`))
                .on("shardDisconnect", (error, shard) => Logger.getLogger("FurryBotStatusService | FurryBotBeta").warn(`Shard ${shard} disconnected.`))
                .once("ready", () => {
                    resolve();
                    Logger.getLogger("FurryBotStatusService | FurryBotBeta").info("Ready!");
                    setInterval(async() => {
                        await this.furrybotBeta.editStatus("dnd", [{
                            type: ActivityTypes.WATCHING,
                            name: "Visit https://maidboye.cafe"
                        }]);
                    }, 6e4);
                })).connect();
        });
        this.ready();
    }
}
