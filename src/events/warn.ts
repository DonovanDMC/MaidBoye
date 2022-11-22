import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";

export default new ClientEvent("warn", async function warnEvent(info, id) {
    Logger.getLogger(`Warning${id ? ` | Shard #${id}` : ""}`).warn(info);
});
