import ClientEvent from "../util/ClientEvent.js";
import StatsHandler from "../util/StatsHandler.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import Config from "../config/index.js";
import { Colors } from "../util/Constants.js";
import Logger from "@uwu-codes/logger";
import { EmbedBuilder } from "@oceanicjs/builders";

export default new ClientEvent("shardDisconnect", async function shardDisconnectEvent(err, id) {
    Logger.error(`Shard #${id} Disconnected`, err);
    StatsHandler.track("SHARD_DISCONNECT", id, (err as Error & { code: number; } | undefined)?.code || null);
    if (!Config.isDevelopment) {
        await WebhookHandler.execute("status", {
            embeds: new EmbedBuilder()
                .setTitle("Shard Disconnect")
                .setDescription(`Shard #${id} disconnected.`)
                .setFooter(`Shard ${id + 1}/${this.shards.size}`, Config.botIcon)
                .setTimestamp(new Date().toISOString())
                .setColor(Colors.red)
                .toJSON(true)
        });
    }
});
