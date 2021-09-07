import MaidBoye from "@MaidBoye";
import Eris from "eris";
import * as fs from "fs-extra";

export type ComponentInteractionType = Omit<Eris.ComponentInteraction<Eris.GuildTextableChannel>, "member" | "user" | "message" | "channel">
& {
	member: Eris.Member;
	user: undefined;
	message: Eris.Message<Eris.GuildTextableChannel>;
	channel: Eris.GuildTextableChannel;
};
export default class ComponentInteractionHandler {
	static handlers = new Map<string, {
		handler(this: MaidBoye, interaction: ComponentInteractionType): Promise<unknown>;
		idExact: boolean;
	}>();
	static handle(interaction: ComponentInteractionType, client: MaidBoye) {
		if (!("id" in interaction)) return;
		const [, { handler } = { handler: null } ] = Array.from(this.handlers.entries()).find(([d, opt]) => {
			if (opt.idExact) return interaction.data.custom_id === d;
			else return interaction.data.custom_id.startsWith(d);
		}) ?? [];
		if (handler === null) return;
		void handler.call(client, interaction);
	}

	static registerHandler(id: string, idExact: boolean, handler: (this: MaidBoye, interaction: ComponentInteractionType) => Promise<unknown>) {
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
