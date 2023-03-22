import E621 from "./req/E621.js";
import SauceNAO from "./req/SauceNAO.js";
import RequestProxy from "./RequestProxy.js";
import Yiffy from "./req/Yiffy.js";
import Config from "../config/index.js";
import type { Post } from "e621";
import type { JSONResponse } from "yiffy";
import { Strings } from "@uwu-codes/utils";
import { fetch } from "undici";
import { STATUS_CODES } from "node:http";

export class PreCheckError extends Error {
    override name = "PreCheckError";
}

export const autoMimeTypes = [
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp"
];
export default async function Sauce(input: string, simularity = 75, skipCheck = false, skipSauceNao = false) {
    // I could include file extensions, but I couldn't be bothered since I only need the md5
    const yrRegex = /(?:https?:\/\/)?yiff\.rocks\/([A-Z_-\da-z]+)/;
    // E621 - e621.net
    const e621Regex = /(?:https?:\/\/)?static\d\.(?:e621|e926)\.net\/data\/(?:sample\/)?(?:[\da-z]{2}\/){2}([\da-z]+)\.[\da-z]+/;
    // YiffyAPI V2 - v2.yiff.res
    const yiffy2Regex = /(?:https?:\/\/)?(?:v2\.yiff\.media|yiff\.media\/V2)\/(?:.*\/)+([\da-z]+)\.[\da-z]+/;
    let post: Post | null = null,
        method: typeof tried[number] | null = null,
        sourceOverride: string | Array<string> | undefined,
        saucePercent = 0,
        snRateLimited = false;

    const tried: Array<"e621" | "yiffy2" | "saucenao"> = [];

    if (Strings.validateURL(input)) {
        if (skipCheck === false) {
            const head = await RequestProxy.head(input);
            if (head.status !== 200 && head.status !== 204) {
                throw new PreCheckError(`A pre-check failed when trying to fetch the image "${input}".\nA \`HEAD\` request returned a non 2XX response (${head.status} ${STATUS_CODES[head.status] || "UNKNOWN"})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`);
            }
        }

        const yr = yrRegex.exec(input);
        if (yr?.[1]) {
            const res = await Yiffy.shortener.get(yr[1]);
            if (res !== null) {
                input = res.fullURL;
            }
        }
        const e6 = e621Regex.exec(input);
        const y2 = yiffy2Regex.exec(input);
        if (e6?.[1]) {
            tried.push("e621");
            post = await E621.posts.getByMD5(e6[1]);
            if (post !== null) {
                method = "e621";
            }
        }

        if (y2?.[1] && !method) {
            tried.push("yiffy2");
            const d = await fetch(`https://v2.yiff.rest/images/${y2[1]}`, {
                headers: {
                    "User-Agent": Config.userAgent
                }
            })
                .then(res => res.json() as Promise<{ data: JSONResponse; success: true; }>)
                .catch(() => null);
            if (d !== null && d.success === true) {
                const s = d.data.sources.find(so => so.includes("e621.net"));
                const m = /https:\/\/e621\.net\/posts\/(\d+)/.exec((s || ""));
                // dont
                if (s && m?.[1]) {
                    post = await E621.posts.get(Number(m[1]));
                    if (post !== null) {
                        method = "e621";
                    }
                } else {
                    method = "yiffy2";
                    sourceOverride = d.data.sources;
                }
            }
        }

        // saucenao is fucky and their api sucks
        if (!skipSauceNao && !method) {
            const sa = await SauceNAO(input, [29, 40, 41, 42]).catch(() => null);
            if (sa !== null && Array.isArray(sa) && sa.length !== 0) {
                const top = sa.sort((a, b)=> a.header.similarity - b.header.similarity).find(v => v.header.similarity >= simularity);
                if (top && top.data.ext_urls.length !== 0) {
                    method = "saucenao";
                    saucePercent = top.header.similarity;
                    sourceOverride = top.data.ext_urls;
                }
            }

            if (sa === "RateLimited") {
                snRateLimited = true;
            } else {
                tried.push("saucenao");
            } // so we don't tell the user we both couldn't try & tried saucenao
        }

        if (post && post.flags.deleted && post.relationships.parent_id !== null) {
            const parent = await E621.posts.get(post.relationships.parent_id);
            if (parent !== null) {
                post = parent;
            }
        }

        return {
            method,
            tried,
            post,
            saucePercent,
            sourceOverride,
            snRateLimited,
            url: input
        };
    } else {
        return null;
    }
}

export async function directMD5(md5: string) {
    let post = await E621.posts.getByMD5(md5),
        method: "e621" | "yiffy2" | null = null,
        sourceOverride: string | Array<string> | undefined,
        url: string | null = null;
    if (post !== null) {
        if (post.flags.deleted && post.relationships.parent_id !== null) {
            const parent = await E621.posts.get(post.relationships.parent_id);
            if (parent !== null) {
                post = parent;
            }
        }
        url = post.file.url;
        method = "e621";
    }

    if (post === null) {
        const yapi = await Yiffy.images.getImage(md5);
        if (yapi !== null) {
            const e = yapi.sources.find(source => source.startsWith("https://e621.net/posts/"));
            let match: RegExpExecArray | null;
            if (e) {
                if ((match = /https:\/\/e621\.net\/posts\/(\d+)/.exec(e))) {
                    post = await E621.posts.get(Number(match[1]));
                    if (post !== null) {
                        if (post.flags.deleted && post.relationships.parent_id !== null) {
                            const parent = await E621.posts.get(post.relationships.parent_id);
                            if (parent !== null) {
                                post = parent;
                            }
                        }
                        url = post.file.url;
                        method = "e621";
                    }
                } else {
                    url = yapi.url;
                    method = "yiffy2";
                    sourceOverride = yapi.sources;
                    post = null;
                }
            }
        }
    }

    return {
        method,
        post,
        sourceOverride,
        url
    };
}
