
import Config from "../config/index.js";
import type { ILogObject } from "tslog";
import { Logger as TSLog } from "tslog";
import { Time } from "@uwu-codes/utils";
import { appendFile, mkdir } from "node:fs/promises";

export default class Logger {
    private static log = new TSLog();
    static get debug() {
        return this.getLogger().debug.bind(this.getLogger());
    }

    static get error() {
        return this.getLogger().error.bind(this.getLogger());
    }

    static get fatal() {
        return this.getLogger().fatal.bind(this.getLogger());
    }

    static get info() {
        return this.getLogger().info.bind(this.getLogger());
    }

    static get silly() {
        return this.getLogger().silly.bind(this.getLogger());
    }

    static get trace() {
        return this.getLogger().trace.bind(this.getLogger());
    }

    static get warn() {
        return this.getLogger().warn.bind(this.getLogger());
    }

    private static async saveToFile(obj: ILogObject) {
        await mkdir(Config.logsDirectory, { recursive: true });
        const d = new Date();
        const current = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;
        await appendFile(`${Config.logsDirectory}/${current}.log`, `${Time.formatDateWithPadding({ date: d, hms: true, millis: true, words: false }).replace(/\//g, "/")} ${obj.logLevel.toUpperCase()} [${obj.loggerName ?? "Unknown"}${obj.filePath ? ` ${obj.filePath}` : ""}${!obj.typeName || !obj.functionName ? "" : ` ${obj.typeName}.${obj.functionName}`}] ${obj.argumentsArray.join(" ")}\n`);
    }

    static getLogger(name?: string) {
        return this.log.getChildLogger({
            name,
            maskValuesOfKeys: [
                Config.clientToken,
                Config.clientSecret
            ],
            dateTimeTimezone: "America/Chicago",
            // Levels: https://github.com/fullstack-build/tslog/blob/2760b4144691a354126059a9d100a8c3c4879895/src/interfaces.ts#L8-L16
            // Default Colors: https://github.com/fullstack-build/tslog/blob/2760b4144691a354126059a9d100a8c3c4879895/src/LoggerWithoutCallSite.ts#L66-L74
            logLevelsColors:  [
                // silly
                "whiteBright",
                // trace
                "white",
                // debug
                "cyan",
                // info
                "green",
                // warn
                "yellow",
                // error
                "red",
                // fatal
                "magenta"
            ]
        });
    }
    static initFileLogging() {
        this.log.attachTransport({
            silly: this.saveToFile.bind(this),
            debug: this.saveToFile.bind(this),
            trace: this.saveToFile.bind(this),
            info:  this.saveToFile.bind(this),
            warn:  this.saveToFile.bind(this),
            error: this.saveToFile.bind(this),
            fatal: this.saveToFile.bind(this)
        });
    }
}

// because attachTransport returns void
Logger.initFileLogging();
