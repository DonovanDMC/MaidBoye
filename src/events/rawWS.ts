import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import { GatewayDispatchEvents, GatewayGuildCreateDispatchData, GatewayOpcodes } from "discord-api-types";
import { VoiceServerUpdate, VoiceStateUpdate } from "lavalink";
import StatsHandler from "@util/handlers/StatsHandler";
import EventsASecondHandler from "@util/handlers/EventsASecondHandler";

export default new ClientEvent("rawWS", async function({ op, d, t }) {
	EventsASecondHandler.add("general");
	const type = t as GatewayDispatchEvents | undefined;
	switch (op) {
		case GatewayOpcodes.Dispatch: {
			if (typeof t !== "string") Logger.getLogger("RawWS").info("Non string event type,", type);
			StatsHandler.trackNoResponse("stats", "events", type!);
			EventsASecondHandler.add(type!);
			switch (type) {
				case "VOICE_STATE_UPDATE": {
					if (!this.lava) return;
					void this.lava.voiceStateUpdate(d as VoiceStateUpdate);
					break;
				}

				case "VOICE_SERVER_UPDATE": {
					if (!this.lava) return;
					void this.lava.voiceServerUpdate(d as VoiceServerUpdate);
					break;
				}

				case "GUILD_CREATE": {
					if (!this.lava) return;
					const dd = d as GatewayGuildCreateDispatchData;
					for (const state of dd.voice_states!) void this.lava.voiceStateUpdate({ ...state, guild_id: dd.id } as VoiceStateUpdate);
					break;
				}
			}
		}
	}
});
