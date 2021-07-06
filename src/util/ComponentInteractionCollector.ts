import { APIMessageComponentInteractionData, APIMessageComponentInteraction, APIGuildMember } from "discord-api-types";

export interface Interaction<T extends APIMessageComponentInteractionData> extends Omit<APIMessageComponentInteraction, "data"> {
	data?: T;
	member: APIGuildMember;
}
export interface InteractionWithData<T extends APIMessageComponentInteractionData> extends Omit<APIMessageComponentInteraction, "data"> {
	data: T;
	member: APIGuildMember;
}
export default class ComponentInteractionCollector {
	static collectors = [] as Array<{
		channel: string;
		filter: (interaction: InteractionWithData<APIMessageComponentInteractionData>) => boolean;
		resolve: (value: Array<InteractionWithData<APIMessageComponentInteractionData>> | Interaction<APIMessageComponentInteractionData>) => void;
		limit: number;
		interactions: Array<InteractionWithData<APIMessageComponentInteractionData>>;
		timeout: number;
		i: NodeJS.Timeout;
	}>;

	static processInteraction(interaction: Interaction<APIMessageComponentInteractionData>) {
		let used = false;
		if (interaction.data === undefined) return false;
		const collectors = this.collectors.filter((col) => col.channel === interaction.channel_id);
		for (const c of collectors) {
			if (c && c.filter(interaction as InteractionWithData<APIMessageComponentInteractionData>)) {
				used = true;
				c.interactions.push(interaction as InteractionWithData<APIMessageComponentInteractionData>);
			}
			if (c.interactions.length >= c.limit) {
				clearTimeout(c.i);
				c.resolve(c.limit === 1 ? c.interactions[0] : c.interactions);
			}
		}

		return used;
	}

	static async awaitInteractions<T extends APIMessageComponentInteractionData>(channelId: string, timeout: number, filter: (interaction: InteractionWithData<APIMessageComponentInteractionData>) => boolean, limit: number): Promise<Array<InteractionWithData<T>>>;
	static async awaitInteractions<T extends APIMessageComponentInteractionData>(channelId: string, timeout: number, filter?: (interaction: InteractionWithData<APIMessageComponentInteractionData>) => boolean, limit?: 1): Promise<InteractionWithData<T> | null>;
	static async awaitInteractions<T extends APIMessageComponentInteractionData>(channelId: string, timeout: number, filter: (interaction: InteractionWithData<APIMessageComponentInteractionData>) => boolean = (() => true), limit?: number): Promise<Array<InteractionWithData<T>> | T | null> {
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
