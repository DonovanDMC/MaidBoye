import type GuildConfig from "./GuildConfig";
import type { DataTypes } from "@uwu-codes/types";

export interface RawLogEvent {
	id: string;
	guild_id: string;
	event: typeof LogEvent["EVENTS"][number];
	webhook_id: string;
	webhook_token: string;
	webhook_channel_id: string;
}
export type LogEventKV = DataTypes<LogEvent>;
export default class LogEvent {
	static MAX_EVENTS = 40;
	static EVENTS = [
		// Channels
		"channelCreate",
		"channelDelete",
		"channelUpdate",

		// Members
		"memberAdd",
		"memberRemove",
		"memberKick",
		"memberUpdate",
		"banAdd",
		"banRemove",

		// Roles
		"roleCreate",
		"roleDelete",
		"roleUpdate",

		// Misc
		"update",
		"all",

		// Invites
		"inviteCreate",
		"inviteDelete",

		// Messages
		"messageDelete",
		"bulkDelete",
		"messageUpdate",

		// Threads
		"threadCreate",
		"threadDelete",
		"threadUpdate",
		"threadJoin",
		"threadLeave",
		"threadMemberUpdate",

		// Voice
		"voiceJoin",
		"voiceLeave",
		"voiceStateUpdate"
	] as const;
	private guild: GuildConfig;
	id: string;
	event: typeof LogEvent["EVENTS"][number];
	webhook: {
		id: string;
		token: string;
		channel: string;
	};
	constructor(data: RawLogEvent, guild: GuildConfig) {
		this.id = data.id;
		this.event = data.event;
		this.webhook = {
			id: data.webhook_id,
			token: data.webhook_token,
			channel: data.webhook_channel_id
		};
		Object.defineProperty(this, "guild", {
			value: guild,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}

	get delete() { return this.guild.removeLogEvent.bind(this.guild, this.id, "id"); }
}
