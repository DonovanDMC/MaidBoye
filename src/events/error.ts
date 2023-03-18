import ClientEvent from "../util/ClientEvent.js";
import Logger from "@uwu-codes/logger";

export default new ClientEvent("error", async function errorEvent(info, id) {
    Logger.getLogger(`Error${id ? ` | Shard #${id}` : ""}`).error(info);
});
