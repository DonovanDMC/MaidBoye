import "./util/MonkeyPatch";
import config, { isPterodactyl, isWSL, wslVersion } from "./config";
import MaidBoye from "./main";
import Logger from "@util/Logger";
import { Time } from "@uwu-codes/utils";
import ErrorHandler from "@util/handlers/ErrorHandler";
import { execSync } from "child_process";

process
	.on("uncaughtException", (err) => {
		void ErrorHandler.handleError(err, "Uncaught Exception");
		Logger.getLogger("Uncaught Exception").error(err);
	})
	.on("unhandledRejection", (err, p) => {
		void ErrorHandler.handleError(err as Error, "Unhandled Rejection");
		Logger.getLogger("Unhandled Rejection").error(err, p);
	})
	.on("SIGINT", () => process.kill(process.pid));

const bot = new MaidBoye(config.client.token, config.client.options);
void bot.getBotGateway().then(function preLaunchInfo({ session_start_limit: { remaining, total, reset_after }, shards }) {
	Logger.getLogger("Launch").info(`Mode: ${config.beta ? "BETA" : "PROD"} | CWD: ${process.cwd()} | PID: ${process.pid}`);
	Logger.getLogger("Launch").info(`Session Limits: ${remaining}/${total} - Reset: ${Time.dateToReadable(new Date(Date.now() + reset_after))} | Recommended Shards: ${shards}`);
	Logger.getLogger("Launch").info("Node Version:", process.version);
	Logger.getLogger("Launch").info(`Platform: ${process.platform} (Manager: ${isWSL ? `WSLv${wslVersion}` : isPterodactyl ? "Pterodactyl" : "None"})`);
	return bot.launch();
});

// for shutdown in pterodactyl
if (process.env.PTR === "1") {
	process.stdin.on("data", async(d) => {
		// slice for newline at the end
		let [cmd, args] = d.toString().slice(0, -1).split(":");

		if (cmd === "stop" && !args) {
			cmd = "node";
			args = "process.kill(process.pid)";
		} else if (cmd === "stop.exit" && !args) {
			cmd = "node";
			args = "process.exit()";
		} else if (cmd === "stop.shell" && !args) {
			cmd = "shell";
			args = `kill -9 ${process.pid}`;
		} else if (cmd === "update" && !args) {
			cmd = "shell";
			args = "git pull --recurse-submodules";
		}

		switch (cmd.toLowerCase()) {
			case "node": {
				// eslint-disable-next-line
				const out = eval(args);
				console.log(`Eval Output (${args}):`);
				console.log(out);
				break;
			}

			case "shell": {
				const out = execSync(args);
				process.stdout.write(`Command Output (${args}):\n`);
				process.stdout.write(out);
				if (!out.toString().endsWith("\n")) process.stdout.write("\n");
				break;
			}

			case "leaveguild": {
				const g = bot.guilds.get(args);
				if (!g) process.stderr.write(`Unable to leave the guild "${args}", we aren't in that guild.`);
				await g!.leave();
				process.stdout.write(`Left the guild "${cmd}".\n`);
				break;
			}

			default: {
				if (!cmd) process.stderr.write("No command provided.\n");
				else process.stderr.write(`Invalid command "${cmd}".\n`);
			}
		}
	});
}
