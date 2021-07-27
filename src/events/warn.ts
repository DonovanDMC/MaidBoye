import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";

export default new ClientEvent("warn", async function(info, id) {
	Logger.getLogger(id === undefined ? undefined : `Shard #${id}`).warn(info);
});
