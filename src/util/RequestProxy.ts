import Config from "../config/index.js";
import { fetch } from "undici";

export default class RequestProxy {
    static DIRECT_WHITELIST = [
        /^https?:\/\/static\d+\.e(621|926)\.net/,
        /^https?:\/\/static\.femboy\.fan/,
        /^https?:\/\/v2\.yiff\.media/,
        /^https?:\/\/yiff\.media\/V2/,
        /^https:\/\/media\.discordapp\.net/,
        /^https:\/\/cdn\.discordapp\.com/
    ];
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

    private static async _req(method: string, url: string, fwdAuth?: string, forceProxy = false) {
        const response = await (!forceProxy && this.DIRECT_WHITELIST.some(d => d.test(url)) ? fetch(url, {
            method,
            headers: {
                "User-Agent": Config.userAgent,
                ...(fwdAuth ? {
                    Authorization: fwdAuth
                } : {})
            }
        }) : fetch(`https://proxy.yiff.rocks/${method.toLowerCase()}?url=${encodeURIComponent(url)}`, {
            method,
            headers: {
                "User-Agent":    Config.userAgent,
                "Authorization": Config.proxyAuth,
                ...(fwdAuth ? {
                    "Forward-Authorization": fwdAuth
                } : {})
            }
        }));
        return {
            ok:     response.status >= 200 || response.status <= 299,
            status: response.status,
            response
        };
    }
}
