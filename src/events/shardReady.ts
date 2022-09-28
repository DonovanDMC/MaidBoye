import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import StatsHandler from "../util/StatsHandler.js";

export default new ClientEvent("shardReady", async function shardReadyEvent(id) {
    Logger.info(`Shard #${id} Ready`);
    StatsHandler.track("SHARD_READY", id);
});
