import MaidBoye from "@MaidBoye";
import Eris from "eris";
export default class ComponentInteractionCollector {
	static client: MaidBoye;
	static collectors = [] as Array<{
		channel: string;
		filter(interaction: Eris.ComponentInteraction): boolean;
		resolve(value: (Eris.ComponentInteraction) | Array<Eris.ComponentInteraction>): void;
		limit: number;
		interactions: Array<Eris.ComponentInteraction>;
		timeout: number;
		i: NodeJS.Timeout;
	}>;
	static setClient(client: MaidBoye) {
		this.client = client;
		this.client.on("interactionCreate", this.processInteraction.bind(this));
	}

	static processInteraction(interaction: Eris.PingInteraction | Eris.ComponentInteraction | Eris.CommandInteraction | Eris.UnknownInteraction) {
		let used = false;
		if (interaction instanceof Eris.PingInteraction || interaction instanceof Eris.UnknownInteraction || interaction instanceof Eris.CommandInteraction) return false;
		if (interaction.data === undefined) return false;
		const collectors = this.collectors.filter((col) => col.channel === interaction.channel.id);
		for (const c of collectors) {
			if (c && c.filter(interaction)) {
				used = true;
				c.interactions.push(interaction);
			}
			if (c.interactions.length >= c.limit) {
				clearTimeout(c.i);
				c.resolve(c.limit === 1 ? c.interactions[0] : c.interactions);
			}
		}

		return used;
	}

	static async awaitInteractions(channelId: string, timeout: number, filter: (interaction: Eris.ComponentInteraction) => boolean, limit: number): Promise<Array<Eris.ComponentInteraction>>;
	static async awaitInteractions(channelId: string, timeout: number, filter?: (interaction: Eris.ComponentInteraction) => boolean, limit?: 1): Promise<Eris.ComponentInteraction | null>;
	static async awaitInteractions(channelId: string, timeout: number, filter: (interaction: Eris.ComponentInteraction) => boolean = (() => true), limit?: number): Promise<Array<Eris.ComponentInteraction | null> | (Eris.ComponentInteraction | Eris.CommandInteraction | null)> {
		return new Promise(resolve => {
			this.collectors.push({
				channel: channelId,
				filter,
				// @ts-ignore idk
				resolve,
				limit: limit || 1,
				interactions: [],
				timeout,
				i: setTimeout(resolve.bind(null, [undefined, 1].includes(limit) ? null : []), timeout)
			});
		});
	}
}
