import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import StatsHandler from "../util/StatsHandler.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import Config from "../config/index.js";
import { Colors } from "../util/Constants.js";
import { EmbedBuilder } from "@oceanicjs/builders";

export default new ClientEvent("shardResume", async function shardResumeEvent(id) {
    Logger.info(`Shard #${id} Resumed`);
    StatsHandler.track("SHARD_RESUME", id);
    await WebhookHandler.execute("status", {
        embeds: new EmbedBuilder()
            .setTitle("Shard Resume")
            .setDescription(`Shard #${id} resumed.`)
            .setFooter(`Shard ${id + 1}/${this.shards.size}`, Config.botIcon)
            .setTimestamp(new Date().toISOString())
            .setColor(Colors.gold)
            .toJSON(true)
    });
});
