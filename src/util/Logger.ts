import { clientInfo, mainLogsDir } from "@config";
import { ILogObject, Logger as TSLog } from "tslog";
import * as fs from "fs-extra";
import { Time } from "@uwu-codes/utils";

export default class Logger {
	private static log = new TSLog();
	private static saveToFile(obj: ILogObject) {
		fs.mkdirpSync(mainLogsDir);
		const d = new Date();
		const current = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
		fs.appendFileSync(`${mainLogsDir}/${current}.log`, `${Time.formatDateWithPadding(d, true, true, false).replace(/\//g, "/")} ${obj.logLevel.toUpperCase()} [${obj.loggerName ?? "Unknown"}${!obj.filePath ? "" : ` ${obj.filePath}`}${!obj.typeName || !obj.functionName ? "" : ` ${obj.typeName}.${obj.functionName}`}] ${obj.argumentsArray.join(" ")}\n`);
	}
	static initFileLogging() {
		this.log.attachTransport({
			silly: this.saveToFile.bind(this),
			debug: this.saveToFile.bind(this),
			trace: this.saveToFile.bind(this),
			info: this.saveToFile.bind(this),
			warn: this.saveToFile.bind(this),
			error: this.saveToFile.bind(this),
			fatal: this.saveToFile.bind(this)
		});
	}
	static getLogger(name?: string) {
		return this.log.getChildLogger({
			name,
			maskValuesOfKeys: [
				clientInfo.token,
				clientInfo.secret
			],
			dateTimeTimezone: "America/Chicago",
			// Levels: https://github.com/fullstack-build/tslog/blob/2760b4144691a354126059a9d100a8c3c4879895/src/interfaces.ts#L8-L16
			// Default Colors: https://github.com/fullstack-build/tslog/blob/2760b4144691a354126059a9d100a8c3c4879895/src/LoggerWithoutCallSite.ts#L66-L74
			logLevelsColors: [
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

	static get silly() { return this.getLogger().silly.bind(this.getLogger()); }
	static get trace() { return this.getLogger().trace.bind(this.getLogger()); }
	static get debug() { return this.getLogger().debug.bind(this.getLogger()); }
	static get info() { return this.getLogger().info.bind(this.getLogger()); }
	static get warn() { return this.getLogger().warn.bind(this.getLogger()); }
	static get error() { return this.getLogger().error.bind(this.getLogger()); }
	static get fatal() { return this.getLogger().fatal.bind(this.getLogger()); }
}

// because attachTransport returns void
Logger.initFileLogging();
