import Command from "./Command";

export default class CommandError extends Error {
	cmd: Command;
	constructor(name: string, cmd: Command) {
		super(name);
		this.name = "CommandError";
		this.cmd = cmd;
	}
}
