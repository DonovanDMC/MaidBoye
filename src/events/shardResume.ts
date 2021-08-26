import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import WebhookStore from "@util/WebhookStore";
import { beta, initialStatus } from "@config";

export default new ClientEvent("shardResume", async function(id) {
	Logger.warn(`Shard #${id} resumed.`);
	this.shards.get(id)!.editStatus(initialStatus.status, initialStatus.game);
	return WebhookStore.execute("status", {
		embeds: [
			EmbedBuilder
				.new()
				.setColor("gold")
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.setTitle("Shard Resume")
				.setDescription(`Shard #${id} resumed.`)
				.toJSON()
		],
		username: `Maid Boye${beta ? " Beta" : ""} Shard Status`
	});
});
