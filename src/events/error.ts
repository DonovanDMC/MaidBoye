import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";

export default new ClientEvent("error", async function errorEvent(info, id) {
    Logger.getLogger(`Error${id ? ` | Shard #${id}` : ""}`).error(info);
});
