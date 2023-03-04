const initTime = process.hrtime.bigint();
/// <reference path="./util/@types/util.d.ts" />
import "./util/MonkeyPatch.js";
import MaidBoye from "./main.js";
import Config from "./config/index.js";
import Logger from "./util/Logger.js";
import { StatusServer, Time } from "@uwu-codes/utils";

const bot = new MaidBoye(initTime);
await bot.rest.getBotGateway().then(function preLaunchInfo({ sessionStartLimit: { remaining, total, resetAfter }, shards }) {
    Logger.getLogger("Launch").info(`Mode: ${Config.isDevelopment ? "BETA" : "PROD"} | CWD: ${process.cwd()} | PID: ${process.pid}`);
    Logger.getLogger("Launch").info(`Session Limits: ${remaining}/${total} - Reset: ${Time.dateToReadable(new Date(Date.now() + resetAfter))} | Recommended Shards: ${shards}`);
    Logger.getLogger("Launch").info("Node Version:", process.version);
    Logger.getLogger("Launch").info(`Platform: ${process.platform} (Manager: ${Config.isDocker ? "Docker" : "None"})`);
    return bot.launch();
});

process
    .on("uncaughtException", err => Logger.getLogger("Uncaught Exception").error(err))
    .on("unhandledRejection", (r, p) => Logger.getLogger("Unhandled Rejection").error(r, p))
    .on("SIGINT", () => {
        bot.shutdown();
        statusServer.close();
        process.exit(0);
    })
    .on("SIGTERM", () => {
        bot.shutdown();
        statusServer.close();
        process.exit(0);
    });

const statusServer = StatusServer(() => bot.ready);
