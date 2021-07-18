export default class Timer {
	static getTime() { return process.hrtime.bigint(); }
	static get start() { return this.getTime.bind(this); }
	static get end() { return this.getTime.bind(this); }

	static calc(start: bigint, end: bigint, dec: number | undefined, raw: false): { val: number; ns: boolean; };
	static calc(start: bigint, end: bigint, dec?: number, raw?: true): number;
	static calc(start: bigint, end: bigint, dec = 3, raw = true) {
		const v = Number(end - start);
		return raw === true ? parseFloat((v * 1e-6).toFixed(dec)) : {
			val: v < 1e6 ? v : parseFloat((v * 1e-6).toFixed(dec)),
			ns: v < 1e6
		};
	}
}
