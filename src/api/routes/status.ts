import Route from "../Route";
import type MaidBoye from "@MaidBoye";
import { beta } from "@config";

export default class StatusRoute extends Route {
	constructor(client: MaidBoye) {
		super("/status");

		this.app.get("/", async(req,res) => {
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
						}
					})),
					latency: onlineShards.reduce((a,b) => a + b.latency, 0) / onlineShards.length,
					mode: beta ? "BETA" : "PROD"
				}
			});
		});
	}
}
