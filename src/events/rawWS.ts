import ClientEvent from "../util/ClientEvent.js";
import StatsHandler from "../util/StatsHandler.js";
import { GatewayOPCodes } from "oceanic.js";

export default new ClientEvent("packet", async function packetEvent(packet, id) {
    StatsHandler.track("GATEWAY_RECIEVE", packet.op, packet.op === GatewayOPCodes.DISPATCH && !(packet.t === "GUILD_CREATE" && !this.shards.get(id)?.ready) ? packet.t : null, [`shard:${id}`]);
});
