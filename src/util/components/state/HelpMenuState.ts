import db from "@db";
import crypto from "crypto";
const Redis = db.r;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface State {

}

export default class HelpMenuState {
	static cacheKey = "helpMenu";

	static async get(guild: string, user: string, id: string) {
		const value = await Redis.get(`componentState:${guild}:${user}:${this.cacheKey}:${id}`);
		if (value === null) return null;
		else return JSON.parse<State>(value);
	}

	static async set(guild: string, user: string) {
		const json = {} as State;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		const str = JSON.stringify(json, (k, v) => typeof v === "bigint" ? String(v) : v);
		const id = crypto.randomUUID();
		const cache = await this.get(guild, user, id);
		if (cache === null) await Redis.set(`componentState:${guild}:${user}:${this.cacheKey}:${id}`, str);
		return id;
	}

	static async update(guild: string, user: string, id: string) {
		const old = await this.get(guild, user, id);
		if (old === null) return false;
		const json = {
			...old
		} as State;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		const str = JSON.stringify(json, (k, v) => typeof v === "bigint" ? String(v) : v);
		await Redis.set(`componentState:${guild}:${user}:${this.cacheKey}:${id}`, str);
		return true;
	}
}
