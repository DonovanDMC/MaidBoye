import Command from "./Command";
import config from "../../config";

export interface AntiSpamEntry {
	addedAt: number;
	user: string;
	command: string;
}
export default class AntiSpam {
	static entries = [] as Array<AntiSpamEntry>;
	static interval: NodeJS.Timeout;
	static add(user: string, cmd: Command | string) {
		this.entries.push({
			addedAt: Date.now(),
			user,
			command: cmd instanceof Command ? cmd.triggers[0] : cmd
		});
	}

	static get(user: string) {
		return this.entries.filter(e => e.user === user);
	}

	static process() {
		const d = Date.now();
		this.entries = this.entries.filter(e => (e.addedAt + config.antiSpam.entryExpiry) > d);
	}
	static init() { this.interval = setInterval(this.process.bind(this), .5e3); }
}
