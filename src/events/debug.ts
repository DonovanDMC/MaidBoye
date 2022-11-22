import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";

export default new ClientEvent("debug", async function debugEvent(info, id) {
    Logger.getLogger(`Debug${id ? ` | Shard #${id}` : ""}`).debug(info);
});
