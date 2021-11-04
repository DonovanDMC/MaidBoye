import type MaidBoye from "@MaidBoye";
import type Eris from "eris";
import * as fs from "fs-extra";

export type ComponentInteractionType = Omit<Eris.ComponentInteraction<Eris.GuildTextableChannel>, "member" | "user" | "message" | "channel">
& {
	member: Eris.Member;
	user: undefined;
	message: Eris.Message<Eris.GuildTextableChannel>;
	channel: Eris.GuildTextableChannel;
};
export type HandlerFunction = (this: MaidBoye, interaction: ComponentInteractionType) => Promise<unknown>;
export interface Handler {
	handler: HandlerFunction;
	idExact: boolean;
}
export default class ComponentInteractionHandler {
	static handlers = new Map<string, Handler>();
	static handle(interaction: ComponentInteractionType, client: MaidBoye) {
		if (!("id" in interaction)) return;
		let handler: HandlerFunction | undefined;
		let handlerId: string | undefined;
		const handlers = Array.from(this.handlers.entries());
		for (const [d, { idExact, handler: func }] of handlers) {
			if (idExact && interaction.data.custom_id === d) {
				handler = func;
				break;
			} else if (interaction.data.custom_id.startsWith(d)) {
				if (!handlerId) {
					handler = func;
					handlerId = d;
				} else {
					// replace if we find one that matches more closely
					if (d > handlerId) {
						handler = func;
						handlerId = d;
					} else continue;
				}
			}
		}
		if (handler === undefined) return;
		void handler.call(client, interaction);
	}

	static registerHandler(id: string, idExact: boolean, handler: HandlerFunction) {
		if (this.handlers.has(id)) throw new Error(`Duplicate handler id "${id}"`);
		this.handlers.set(id, {
			handler,
			idExact
		});

		return this;
	}

	static init() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		fs.readdirSync(`${__dirname}`).filter(v => v !== "main.ts").map(v => fs.lstatSync(`${__dirname}/${v}`).isFile() ? require(`${__dirname}/${v}`) : fs.readdirSync(`${__dirname}/${v}`).map(f => require(`${__dirname}/${v}/${f}`)));
	}
}
