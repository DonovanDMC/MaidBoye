const initTime = process.hrtime.bigint();
/// <reference path="./util/@types/util.d.ts" />
import "./util/MonkeyPatch.js";
import MaidBoye from "./main.js";
import Config from "./config/index.js";
import Logger from "@uwu-codes/logger";
import { Time } from "@uwu-codes/utils";
import StatusServer, { type AnyServer } from "@uwu-codes/status-server";
Logger._saveToRotatingFile(Config.logsDirectory);

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
    .on("unhandledRejection", (r, p) => {
        console.error(r, p);
        Logger.getLogger("Unhandled Rejection | Reason").error(r);
        Logger.getLogger("Unhandled Rejection | Promise").error(p);
    })
    .once("SIGINT", () => {
        bot.shutdown();
        statusServer?.close();
        process.kill(process.pid, "SIGINT");
    })
    .once("SIGTERM", () => {
        bot.shutdown();
        statusServer?.close();
        process.kill(process.pid, "SIGTERM");
    });

let statusServer: AnyServer | undefined;

if (Config.isDocker) {
    statusServer = StatusServer(() => bot.ready);
}
