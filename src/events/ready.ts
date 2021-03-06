import API from "../api";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import { beta, clientInfo, services, statuses } from "@config";
import { Utility } from "@uwu-codes/utils";
import { Node } from "lavalink";
import { TimedModerationHandler } from "@handlers/ModLogHandler";

export default new ClientEvent("ready", async function() {
	if (this.firstReady === true) return Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
	this.firstReady = true;
	Logger.info(`Ready as ${this.user.username}#${this.user.discriminator}`);
	this.editStatus("online", statuses(this)[0]);
	setInterval(() => {
		const d = new Date();
		const status = statuses(this).find(s => s.filter(d.getHours(), d.getMinutes(), d.getSeconds()));
		if (status) this.editStatus("online", status);
	}, 1e3);
	await API.launch(this);
	this.cpuUsage = await Utility.getCPUUsage();
	setInterval(async() =>
		this.cpuUsage = await Utility.getCPUUsage()
	, 1e3);
	TimedModerationHandler.init();

	if (!beta) {
		void this.syncApplicationCommands.call(this);
		void this.syncLiteApplicationCommands.call(this);
	} else Logger.getLogger("Ready").info("Not syncing commands due to being in beta mode");
});
