import { Telegraf } from "telegraf";
import { OmitFirstArg } from "@uwu-codes/types";

type Handler = Parameters<OmitFirstArg<Telegraf["command"]>>[0];
export default class Command {
	command: Parameters<Telegraf["command"]>[0];
	description: string;
	handlers: [first: Handler, ...other: Array<Handler>];
	// a lot of their types are private
	constructor(command: Command["command"], description: string, first: Handler, ...other: Array<Handler>) {
		this.command = command;
		this.description = description;
		this.handlers = [first, ...other];
	}
}
