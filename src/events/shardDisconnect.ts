import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import StatsHandler from "../util/StatsHandler.js";

export default new ClientEvent("shardDisconnect", async function shardDisconnectEvent(err, id) {
    Logger.error(`Shard #${id} Disconnected`, err);
    StatsHandler.track("SHARD_DISCONNECT", id, (err as Error & { code: number; } | undefined)?.code || null);
});
