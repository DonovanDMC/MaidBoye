import Command from "./Command";

export default class AntiSpam {
	static entries = new Map<string, number>();
	static interval: NodeJS.Timeout;
	static add(user: string, cmd: string | Command, cooldown: number) {
		const d = Date.now();
		this.entries.set(`${user}-${cmd instanceof Command ? cmd.triggers[0] : cmd}`, d + cooldown);
	}

	static remove(user: string, cmd: string | Command) {
		return this.entries.delete(`${user}-${cmd instanceof Command ? cmd.triggers[0] : cmd}`);
	}

	static process() {
		const d = Date.now();
		const e = this.entries.entries();
		for (const [k, v] of e) {
			if (v < d) this.remove(k.split("-")[0], k.split("-")[1]);
		}
	}

	static init() { this.interval = setInterval(this.process.bind(this), .5e3); }
}
