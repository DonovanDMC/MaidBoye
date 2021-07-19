import { Time } from "@uwu-codes/utils";

export default class Timer {
	static getTime() { return process.hrtime.bigint(); }
	static get start() { return this.getTime.bind(this); }
	static get end() { return this.getTime.bind(this); }

	static calc(start: bigint, end: bigint, dec = 3, raw = true) {
		const v = Number(end - start);
		return raw === true ? parseFloat((v).toFixed(dec)) : Time.convert(parseFloat((v).toFixed(dec)), "ns", dec);
	}
}
