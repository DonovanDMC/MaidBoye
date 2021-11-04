import type MaidBoye from "@MaidBoye";
import type Eris from "eris";
import * as fs from "fs-extra";

export type AutocompleteInteractionType = Omit<Eris.AutocompleteInteraction<Eris.GuildTextableChannel>, "member" | "user" | "message" | "channel">
& {
	member: Eris.Member;
	user: undefined;
	message: Eris.Message<Eris.GuildTextableChannel>;
	channel: Eris.GuildTextableChannel;
};
export type HandlerFunction = (this: MaidBoye, option: [] | [opt1: string] | [opt1: string, opt2: string], input: string | number | boolean, interaction: AutocompleteInteractionType) => Promise<unknown>;
export default class AutocompleteInteractionHandler {
	static handlers = new Map<string, HandlerFunction>();
	static handle(interaction: AutocompleteInteractionType, client: MaidBoye) {
		if (!("id" in interaction)) return;
		const handlers = Array.from(this.handlers.entries());
		for (const [id, func] of handlers) {
			const [command, sub1 = null, sub2 = null] = id.split(".");
			if (interaction.data.name !== command) continue;
			let opt1 = interaction.data.options!.find(o => "value" in o && o.focused === true);
			if (!opt1) opt1 = interaction.data.options!.find(o => "options" in o && o.options!.find(oo => "value" in oo && oo.focused === true));
			if (!opt1) continue;
			const opt2 = "value" in opt1 && opt1.focused === true ? null : (interaction.data.options![interaction.data.options!.indexOf(opt1)] as Eris.InteractionDataOptionsSubCommand).options?.find(o => "value" in o && o.focused === true);
			if (sub1 && opt1?.name !== sub1) continue;
			if (sub2 && opt2?.name !== sub2) continue;
			void func.call(client, !opt2 ? [opt1.name] : [opt1.name, opt2.name], opt2 && "value" in opt2 ? opt2.value : opt1 && "value" in opt1 ? opt1.value : "", interaction);
			break;
		}
	}

	static registerHandler(command: string, option: string | [string] | [opt1: string, opt2: string], handler: HandlerFunction) {
		const id = `${command}.${Array.isArray(option) ? option.join(".") : option}`;
		if (this.handlers.has(id)) throw new Error(`Duplicate handler id "${id}"`);
		this.handlers.set(id, handler);

		return this;
	}

	static init() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		fs.readdirSync(`${__dirname}`).filter(v => v !== "main.ts").map(v => fs.lstatSync(`${__dirname}/${v}`).isFile() ? require(`${__dirname}/${v}`) : fs.readdirSync(`${__dirname}/${v}`).map(f => require(`${__dirname}/${v}/${f}`)));
	}
}
