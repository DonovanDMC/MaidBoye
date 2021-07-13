export default class EventsASecondHandler {
	static interval = setInterval(this.removeOld.bind(this), 1e3);
	static entries =  [] as Array<{ name: string; time: bigint; }>;
	static add(name: string) {
		this.entries.push({ name, time: process.hrtime.bigint() });
	}
	static LENGTH = 5;
	static removeOld() {
		const now = process.hrtime.bigint();
		const difference = BigInt(this.LENGTH) * 1000000000n;
		const o = this.entries.length;
		this.entries = this.entries.filter(e => (e.time + difference) > now);
		return o - this.entries.length;
	}
	static get(name: string): number;
	static get<T extends string>(): Record<T, number>;
	static get(name?: string) {
		if (name) return this.entries.filter(v => v.name === name).length / this.LENGTH;
		else {
			const n = [] as Array<string>;
			for (const v of this.entries) if (!n.includes(v.name)) n.push(v.name);
			return n.map(v => ({
				[v]: this.get(v)
			})).reduce((a,b) => ({ ...a, ...b }), {});
		}
	}
}

// setInterval(() => console.log(EventsASecondHandler.get()), .5e3);
