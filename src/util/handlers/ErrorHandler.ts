import Logger from "../Logger";
import WebhookStore from "../WebhookStore";
import EmbedBuilder from "../EmbedBuilder";
import ExtendedMessage from "../ExtendedMessage";
import { dependencies } from "@root/package.json";
import { dependencies as shrinkDependencies } from "@root/package-lock.json";
import { apiURL, beta, errorsDir } from "@config";
import * as fs from "fs-extra";
import type { DiscordRESTError } from "eris";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import * as os from "os";
import crypto from "crypto";

export default class ErrorHandler {
	static getId() { return crypto.randomBytes(6).toString("hex"); }
	// array of already logged errors, first 2 lines of the stack
	private static errorCache = [] as Array<string>;
	static async handleError(err: Error, from: string | ExtendedMessage) {
		if (!err.stack) return null;
		const stackPart = err.stack.split("\n").slice(0, 1).join("\n");
		if (this.errorCache.map(e => e.toLowerCase()).includes(stackPart.toLowerCase())) {
			Logger.getLogger("ErrorHandler").error("Duplicate error stack reported, error:", err);
			return null;
		}

		const id = this.getId();
		const code = `err.${beta ? "beta" : "prod"}.${id}`;
		fs.mkdirpSync(errorsDir);
		fs.writeFileSync(`${errorsDir}/${id}`, [
			"-- System --",
			`Mode: ${beta ? "BETA" : "PROD"}`,
			`Server Hostname: ${os.hostname()}`,
			`CWD: ${process.cwd()}`,
			`PID: ${process.pid}`,
			`Node Version: ${process.version}`,
			`Eris Version: ${dependencies.eris} (${shrinkDependencies.eris.version})`,
			"",
			"-- Info --",
			...(from instanceof ExtendedMessage ? [
				"Source: Message",
				`Executor: ${from.author.tag} (${from.author.id})`,
				`Guild: ${from.channel.guild.name} (${from.channel.guild.id})`,
				`Channel: ${from.channel.name} (${from.channel.guild.id}, type: ${from.channel.type}/${Object.entries(Eris.Constants.ChannelTypes).find(t => t[1] === from.channel.type)![0]})`,
				`Command: ${from.cmd === null ? "None" : `${from.cmd.category} -> ${from.cmd.triggers[0]}`}`,
				`Arguments: [${from.args.join(", ")}] (raw: [${from.rawArgs.join(", ")}])`
			] : [
				`Source: ${from}`
			]),
			`ID: ${id}`,
			`Code: ${code}`,
			"",
			"-- Error -- ",
			err.stack ?? "[No Stack]"
		].join("\n"));

		Logger.getLogger("ErrorHandler").error(`Error Code: ${code}, Stack:`);
		console.error("Error", err);

		await WebhookStore.execute("errors", {
			embeds: [
				new EmbedBuilder()
					.setTitle(Strings.truncate(`${err.name}: ${err.message}`, 256))
					.setDescription([
						...(from instanceof ExtendedMessage ? [
							"Source: Message",
							`Executor: ${from.author.tag} (${from.author.id})`,
							`Guild: ${from.channel.guild.name} (${from.channel.guild.id})`,
							`Channel: ${from.channel.name} (${from.channel.guild.id}, type: ${from.channel.type}/${Object.entries(Eris.Constants.ChannelTypes).find(t => t[1] === from.channel.type)![0]})`,
							`Command: ${from.cmd === null ? "None" : `${from.cmd.category} -> ${from.cmd.triggers[0]}`}`,
							`Arguments: [${from.args.join(", ")}] (raw: [${from.rawArgs.join(", ")}])`
						] : [
							`Source: ${from}`
						]),
						"",
						`Code: \`${code}\``,
						`ID: \`${id}\``,
						`Report: [${apiURL}/errors/${id}](${apiURL}/errors/${id})`
					].join("\n"))
					.setColor("red")
					.toJSON()
			]
		});

		return code;
	}

	static async handleDiscordError(err: DiscordRESTError, msg: ExtendedMessage) {
		if ([
			10008, // unknown message
			10062, // unknown interaction
			50001  // missing access
		].includes(err.code)) {
			Logger.getLogger(`ErrorHandler[DiscordRESTError/${msg.cmd!.triggers[0]}]`).error("(ignored)", err);
			return;
		} else return this.handleError(err, msg);
	}
}
