import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawLogEvent {
	id: string;
	guild_id: string;
	event: string;
	webhook_id: string;
	webhook_token: string;
	webhook_channel_id: string;
}
export type LogEventKV = DataTypes<LogEvent>;
export default class LogEvent {
	static EVENTS = [
		// channel
		"channelCreate",
		"channelDelete",
		"channelUpdate",

		// ban
		"banAdd",
		"banRemove",

		// member
		"memberAdd",
		"memberRemove",
		"memberUpdate",

		// role
		"roleCreate",
		"roleDelete",
		"roleUpdate",

		// guild
		"update",

		// invite
		"inviteCreate",
		"inviteDelete",

		// message
		"messageDelete",
		"bulkDelete",
		"messageUpdate",

		// thread
		"threadCreate",
		"threadDelete",
		"threadUpdate",
		"threadMembersUpdate",
		"threadMemberUpdate"
	] as const;
	private guild: GuildConfig;
	id: string;
	event: string;
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
