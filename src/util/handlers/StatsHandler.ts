import db from "@db";
const { r: Redis } = db;

// https://api.paw.bot/v1/status
export default class StatsHandler {
	static async track(first: string, ...other: Array<string>) {
		return Redis.incr(other.length === 0 ? first : [first, ...other].join(":"));
	}

	static trackNoResponse(first: string, ...other: Array<string>) {
		void this.track(first, ...other);
	}

	static trackBulk(first: string, ...other: Array<string>) {
		if (other.length === 0) return this.track(first);
		const m = Redis.multi();
		[first, ...other].forEach(o => m.incr(o));
		return m.exec();
	}

	static trackBulkNoResponse(first: string, ...other: Array<string>) {
		void this.trackBulk(first, ...other);
	}
}
