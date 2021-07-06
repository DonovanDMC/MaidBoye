import config from "../config";
import ClientEvent from "../util/ClientEvent";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";
import WebhookStore from "../util/WebhookStore";

export default new ClientEvent("shardDisconnect", async function shardDisconnectEvent (err, id) {
	Logger.error(`Shard #${id} disconnected.`, err);
	this.shards.get(id)!.editStatus(config.client.initialStatus.status, config.client.initialStatus.game);
	return WebhookStore.execute("status", {
		embeds: [
			EmbedBuilder
				.new()
				.setColor("red")
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.setTitle("Shard Disconnect")
				.setDescription(`Shard #${id} disconnected.`)
				.toJSON()
		],
		username: `Maid Boye${config.beta ? " Beta" : ""} Shard Status`
	});
});
