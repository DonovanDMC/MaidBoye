import Config from "../config/index.js";
import { fetch } from "undici";

export default class RequestProxy {
    static get delete() {
        return this._req.bind(this, "DELETE");
    }

    static get get() {
        return this._req.bind(this, "GET");
    }

    static get head() {
        return this._req.bind(this, "HEAD");
    }

    static get patch() {
        return this._req.bind(this, "PATCH");
    }

    static get post() {
        return this._req.bind(this, "POST");
    }

    static get put() {
        return this._req.bind(this, "PUT");
    }

    private static async _req(method: string, url: string, fwdAuth?: string) {
        const response = await fetch(`https://proxy.yiff.rocks/${method.toLowerCase()}?url=${encodeURIComponent(url)}`, {
            method,
            headers: {
                "User-Agent":    Config.userAgent,
                "Authorization": Config.proxyAuth,
                ...(fwdAuth ? {
                    "Forward-Authorization": fwdAuth
                } : {})
            }
        });
        return {
            ok: response.status >= 200 || response.status <= 299,
            status: response.status,
            response
        }
    }
}
