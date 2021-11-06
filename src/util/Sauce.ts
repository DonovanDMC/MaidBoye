import E621, { YiffyV3 } from "./req/E621";
import SauceNAO from "./req/SauceNAO";
import RequestProxy from "./RequestProxy";
import { userAgent } from "@config";
import type { Post } from "e621";
import fetch from "node-fetch";
import type { JSONResponse } from "yiffy";
import { Strings } from "@uwu-codes/utils";

export class PreCheckError extends Error {
	name = "PreCheckError";
}

export const autoMimeTypes = [
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp"
];
export default async function Sauce(url: string, simularity = 75, skipCheck = false) {
	// I could include file extensions, but I couldn't be bothered since I only need the md5
	// E621 - e621.net - primary e621ng
	const e621Regex = /(?:https?:\/\/)?static\d\.(?:e621|e926)\.net\/data\/(?:sample\/)?(?:[a-z\d]{2}\/){2}([a-z\d]+)\.[a-z]+/;
	// YiffyAPI V2 - v2.yiff.rest - other
	const yiffyRegex_2 = /(?:https?:\/\/)?(?:v2\.yiff\.media|yiff\.media\/V2)\/(?:.*\/)+([a-z\d]+)\.[a-z]+/;
	// YiffyAPI V3 - yiff.rest - modified e621ng instance
	const yiffyRegex_3 = /(?:https?:\/\/)?(?:v3\.yiff\.media|yiff\.media\/V3)\/(?:sample\/)?(?:[a-z\d]{2}\/){2}([a-z\d]+)\.[a-z]+/;
	// for disabling embeds
	if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);
	let post: Post | null = null,
		method: "e621" | "yiffy2" | "yiffy3" | "saucenao" | undefined,
		sourceOverride: string | Array<string> | undefined,
		saucePercent = 0,
		snRateLimited = false;

	const tried: Array<Exclude<typeof method, undefined>> = [];

	if (Strings.validateURL(url)) {
		if (skipCheck === false) {
			const head = await RequestProxy.head(url);
			if (head.status !== 200 && head.status !== 204) throw new PreCheckError(`A pre-check failed when trying to fetch the image "<${url}>".\nA \`HEAD\` request returned a non 200 OK/204 No Content responses (${head.status} ${head.statusText})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`);
		}

		const e6 = e621Regex.exec(url);
		const y2 = yiffyRegex_2.exec(url);
		const y3 = yiffyRegex_3.exec(url);
		if (e6?.[1]) {
			tried.push("e621");
			post = await E621.posts.getByMD5(e6[1]);
			if (post !== null) method = "e621";
		}

		if (y2?.[1] && !method) {
			tried.push("yiffy2");
			const d = await fetch(`https://v2.yiff.rest/images/${y2[1]}.json`, {
				headers: {
					"User-Agent": userAgent
				}
			})
				.then(res => res.json() as Promise<{ success: true; data: JSONResponse; }>)
				.catch(() => null);
			if (d !== null && d.success === true) {
				const s = d.data.sources.find(so => so.includes("e621.net"));
				const m = /https:\/\/e621\.net\/posts\/(\d+)/.exec((s || ""));
				// dont
				if (s && m?.[1]) {
					post = await E621.posts.get(Number(m[1]));
					if (post !== null) method = "e621";
				} else {
					method = "yiffy2";
					sourceOverride = d.data.sources;
				}
			}
		}

		if (y3?.[1] && !method) {
			tried.push("yiffy3");
			post = await YiffyV3.posts.getByMD5(y3[1]);
			if (post !== null) method = "yiffy3";
		}

		// saucenao is fucky and their api sucks
		if (!method) {
			tried.push("saucenao");
			const sa = await SauceNAO(url, [29, 40, 41, 42]).catch(() => null);
			if (sa !== null && Array.isArray(sa) && sa.length > 0) {
				const top = sa.sort((a, b)=> a.header.similarity - b.header.similarity).find(v => v.header.similarity >= simularity);
				if (top && top.data.ext_urls.length > 0) {
					method = "saucenao";
					saucePercent = top.header.similarity;
					sourceOverride = top.data.ext_urls;
				}
			}

			if (sa === "RateLimited") snRateLimited = true;
		}

		return {
			method,
			tried,
			post,
			saucePercent,
			sourceOverride,
			snRateLimited,
			url
		};
	} else return null;
}
