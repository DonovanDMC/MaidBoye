import Route from "../Route";
import type MaidBoye from "@MaidBoye";
import { beta } from "@config";
import CommandHandler from "@cmd/CommandHandler";

export default class StatusRoute extends Route {
	constructor(client: MaidBoye) {
		super("/stats");

		this.app.get("/", async(req, res) => {
			const onlineShards = client.shards.filter(shard => shard.status === "ready");
			res.status(200).json({
				success: true,
				data: {
					online: onlineShards.length === 0 ? false : onlineShards.length === client.shards.size ? true : "partial",
					shards: client.shards.map(shard => ({
						id: shard.id,
						status: shard.status,
						latency: shard.latency,
						heartbeat: {
							lastAck: shard.lastHeartbeatAck,
							lastRecieved: shard.lastHeartbeatReceived,
							lastSent: shard.lastHeartbeatSent
						},
						guilds: client.guilds.filter(g => g.shard.id === shard.id).length,
						largeGuilds: client.guilds.filter(g => g.shard.id === shard.id && g.large).length,
						users: client.guilds.filter(g => g.shard.id === shard.id).reduce((a,b) => a + b.memberCount, 0),
						channels: client.guilds.filter(g => g.shard.id === shard.id).reduce((a,b) => a + b.channels.size, 0)
					})),
					latency: onlineShards.reduce((a,b) => a + b.latency, 0) / onlineShards.length,
					guilds: client.guilds.size,
					largeGuilds: client.guilds.filter(g => g.large).length,
					users: client.guilds.reduce((a,b) => a + b.memberCount, 0),
					channels: client.guilds.reduce((a,b) => a + b.channels.size, 0),
					voiceConnections: client.voiceConnections.size,
					commands: CommandHandler.commands.length,
					mode: beta ? "BETA" : "PROD"
				}
			});
		});
	}
}
