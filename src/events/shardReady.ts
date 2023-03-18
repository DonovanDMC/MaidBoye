import ClientEvent from "../util/ClientEvent.js";
import StatsHandler from "../util/StatsHandler.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import { Colors } from "../util/Constants.js";
import Config from "../config/index.js";
import Logger from "@uwu-codes/logger";
import { EmbedBuilder } from "@oceanicjs/builders";

export default new ClientEvent("shardReady", async function shardReadyEvent(id) {
    Logger.info(`Shard #${id} Ready`);
    StatsHandler.track("SHARD_READY", id);
    if (!Config.isDevelopment) {
        await WebhookHandler.execute("status", {
            embeds: new EmbedBuilder()
                .setTitle("Shard Ready")
                .setDescription(`Shard #${id} is ready.`)
                .setFooter(`Shard ${id + 1}/${this.shards.size}`, Config.botIcon)
                .setTimestamp(new Date().toISOString())
                .setColor(Colors.green)
                .toJSON(true)
        });
    }
});
