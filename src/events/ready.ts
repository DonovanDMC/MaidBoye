import API from "../api";
import config from "@config";
import ClientEvent from "../util/ClientEvent";
import Logger from "../util/Logger";
import { Utility } from "@uwu-codes/utils";
import { Node } from "lavalink";

export default new ClientEvent("ready", async function() {
	if (this.firstReady === true) return Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
	this.firstReady = true;
	Logger.info(`Ready as ${this.user.username}#${this.user.discriminator}`);
	this.editStatus("online", config.client.statuses(this)[0]);
	setInterval(() => {
		const d = new Date();
		const status = config.client.statuses(this).find(s => s.filter(d.getHours(), d.getMinutes(), d.getSeconds()));
		if (status) this.editStatus("online", status);
	}, 500);
	await API.launch(this);
	this.cpuUsage = await Utility.getCPUUsage();
	setInterval(async() => {
		this.cpuUsage = await Utility.getCPUUsage();
	}, 1e3);
	this.lava = new Node({
		password: config.services.lavalink.password,
		userID: config.client.id,
		shardCount: this.shards.size,
		host: `${config.services.lavalink.host}:${config.services.lavalink.port}`,
		send: (guildId, packet) => {
			this.shards.get(Number(((BigInt(guildId) >> 22n) % BigInt(this.shards.size)).toString()))?.sendWS((packet as { op: number; }).op, (packet as { d: Record<string, unknown>; }).d);
		}
	});
});
