import GuildConfig from "./GuildConfig";
import { DataTypes } from "@uwu-codes/types";

export interface RawLogEvent {
	id: string;
	guild_id: string;
	event: string;
	channel: string;
}
export type LogEventKV = DataTypes<LogEvent>;
export default class LogEvent {
	private guild: GuildConfig;
	id: string;
	event: string;
	channel: string;
	constructor(data: RawLogEvent, guild: GuildConfig) {
		this.id = data.id;
		this.guild = guild;
		this.event = data.event;
		this.channel = data.channel;
	}

	get delete() { return this.guild.removeLogEvent.bind(this.guild, this.id, "id"); }
}
