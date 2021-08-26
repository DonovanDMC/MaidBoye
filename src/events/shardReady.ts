import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import WebhookStore from "@util/WebhookStore";
import { beta, initialStatus } from "@config";

export default new ClientEvent("shardReady", async function(id) {
	Logger.debug(`Shard #${id} is ready.`);
	this.shards.get(id)!.editStatus(initialStatus.status, initialStatus.game);
	return WebhookStore.execute("status", {
		embeds: [
			EmbedBuilder
				.new()
				.setColor("green")
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.setTitle("Shard Ready")
				.setDescription(`Shard #${id} is ready.`)
				.toJSON()
		],
		username: `Maid Boye${beta ? " Beta" : ""} Shard Status`
	});
});
