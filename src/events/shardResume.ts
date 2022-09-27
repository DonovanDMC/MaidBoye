import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import StatsHandler from "../util/StatsHandler.js";

export default new ClientEvent("shardResume", async function shardResumeEvent(id) {
    Logger.info(`Shard #${id} Resumed`);
    StatsHandler.track("SHARD_RESUME", id);
});
