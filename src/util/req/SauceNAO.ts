import Config from "../../config/index.js";
import Logger from "@uwu-codes/logger";
import { fetch } from "undici";
// only used for types, because saucenao sucks ass and they
// abandoned the module
import type { Response } from "sagiri/dist/response.js";
import { inspect } from "node:util";

export default async function SauceNAO(url: string, dbs: Array<number>) {
    return fetch(`https://saucenao.com/search.php?${dbs.map(db => `dbs[]=${db}`).join("&")}&output_type=2&numres=4&url=${encodeURIComponent(url)}&api_key=${Config.saucenaoAPIKey}`)
        .then(async res => {
            if (res.status === 429) {
                return "RateLimited" as const;
            }
            const { header, results = null } = await res.json() as Response;
            // assume failed request, they all return 200 OK
            if ("message" in header) {
                Logger.getLogger("SauceNAO").error(`${res.status} ${res.statusText}: ${inspect({ header, results })}`);
                return null;
            }
            return results;
        })
        .catch(() => null);
}
