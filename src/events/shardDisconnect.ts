import { beta } from "@config";
import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import WebhookStore from "@util/WebhookStore";

export default new ClientEvent("shardDisconnect", async function shardDisconnectEvent (err, id) {
	Logger.error(`Shard #${id} disconnected.`, err);
	// this.shards.get(id)!.editStatus(initialStatus.status, initialStatus.game);
	return WebhookStore.execute("status", {
		embeds: [
			EmbedBuilder
				.new()
				.setColor("red")
				.setFooter(`Shard ${Number(id) + 1}/${this.shards.size}`)
				.setTitle("Shard Disconnect")
				.setDescription(`Shard #${id} disconnected.`)
				.toJSON()
		],
		username: `Maid Boye${beta ? " Beta" : ""} Shard Status`
	});
});
