import { userAgent, apiKeys } from "@config";
import fetch from "node-fetch";

export default class RequestProxy {
	private static async _req(method: string, url: string, fwdAuth?: string) {
		return fetch(`https://proxy.yiff.rocks/${method.toLowerCase()}?url=${encodeURIComponent(url)}`, {
			method,
			headers: {
				"User-Agent": userAgent,
				"Authorization": `Basic ${Buffer.from(`${apiKeys.proxy.user}:${apiKeys.proxy.password}`).toString("base64")}`,
				...(fwdAuth ? {
					"Forward-Authorization": fwdAuth
				} : {})
			}
		});
	}

	static get head() { return this._req.bind(this, "HEAD"); }
	static get get() { return this._req.bind(this, "GET"); }
	static get post() { return this._req.bind(this, "POST"); }
	static get put() { return this._req.bind(this, "PUT"); }
	static get patch() { return this._req.bind(this, "PATCH"); }
	static get delete() { return this._req.bind(this, "DELETE"); }
}
