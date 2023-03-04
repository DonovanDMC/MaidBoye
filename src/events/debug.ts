import Config from "../config/index.js";
import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";

export default new ClientEvent("debug", async function debugEvent(info, id) {
    if (!Config.debugLogging) {
        return;
    }
    Logger.getLogger(`Debug${id ? ` | Shard #${id}` : ""}`).debug(info);
});
