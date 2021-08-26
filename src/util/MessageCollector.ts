import MaidBoye from "../main";
import Eris from "eris";

export default class MessageCollector {
	static client: MaidBoye;
	static collectors = [] as Array<{
		channel: string;
		filter(msg: Eris.Message<Eris.TextableChannel>): boolean;
		resolve(value: Array<Eris.Message<Eris.TextableChannel>> | Eris.Message<Eris.TextableChannel>): void;
		limit: number;
		messages: Array<Eris.Message<Eris.TextableChannel>>;
		timeout: number;
		i: NodeJS.Timeout;
	}>;
	static setClient(client: MaidBoye) {
		this.client = client;
		this.client.on("messageCreate", this.processMessage.bind(this));
	}

	static processMessage(msg: Eris.Message<Eris.TextableChannel>) {
		if (msg.author.bot) return;
		const collectors = this.collectors.filter((col) => col.channel === msg.channel.id);
		for (const c of collectors) {
			if (c && c.filter(msg)) c.messages.push(msg);
			if (c.messages.length >= c.limit) {
				clearTimeout(c.i);
				c.resolve(c.limit === 1 ? c.messages[0] : c.messages);
			}
		}
	}

	static async awaitMessages<T extends Eris.TextableChannel = Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>>(channelId: string, timeout: number, filter: (msg: Eris.Message<Eris.TextableChannel>) => boolean, limit: number): Promise<Array<Eris.Message<T>>>;
	static async awaitMessages<T extends Eris.TextableChannel = Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>>(channelId: string, timeout: number, filter?: (msg: Eris.Message<Eris.TextableChannel>) => boolean, limit?: 1): Promise<Eris.Message<T> | null>;
	static async awaitMessages<T extends Eris.TextableChannel = Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>>(channelId: string, timeout: number, filter: (msg: Eris.Message<Eris.TextableChannel>) => boolean = (() => true), limit?: number): Promise<Array<Eris.Message<T>> | Eris.Message<T> | null> {
		return new Promise(resolve => {
			this.collectors.push({
				channel: channelId,
				filter,
				// @ts-ignore idk
				resolve,
				limit: limit || 1,
				messages: [],
				timeout,
				i: setTimeout(resolve.bind(null, [undefined, 1].includes(limit) ? null : []), timeout)
			});
		});
	}
}
