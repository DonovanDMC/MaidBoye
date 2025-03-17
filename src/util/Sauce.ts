import E621 from "./req/E621.js";
import SauceNAO from "./req/SauceNAO.js";
import RequestProxy from "./RequestProxy.js";
import Yiffy from "./req/Yiffy.js";
import FemboyFans from "./req/FemboyFans.js";
import Util from "./Util.js";
import Config from "../config/index.js";
import type { Post } from "e621";
import type { JSONResponse } from "yiffy";
import { Strings } from "@uwu-codes/utils";
import { fileTypeFromBuffer } from "file-type";
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
export default async function Sauce(input: string, similarity = 80, skipCheck = false, skipSauceNao = false) {
    // I could include file extensions, but I couldn't be bothered since I only need the md5
    const yrRegex = /(?:https?:\/\/)?yiff\.rocks\/([A-Z_-\da-z]+)/;
    // E621 - e621.net
    const e621Regex = /(?:https?:\/\/)?static\d\.(?:e621|e926)\.net\/data\/(?:sample\/)?(?:[\da-z]{2}\/){2}([\da-z]+)\.[\da-z]+/;
    // YiffyAPI V2 - v2.yiff.rest
    const yiffy2Regex = /(?:https?:\/\/)?(?:v2\.yiff\.media|yiff\.media\/V2)\/(?:.*\/)+([\da-z]+)\.[\da-z]+/;
    // FemboyFans - static.femboy.fan
    const femboyfansRegex = /(?:https?:\/\/)?static\.femboy\.fan\/(?:.*\/)+([\da-z]+)\.[\da-z]+/;
    let post: Post | null = null,
        ffpost: FemboyFans.Post | null = null,
        method: typeof tried[number] | null = null,
        sourceOverride: string | Array<string> | undefined,
        saucePercent = 0,
        snRateLimited = false;

    const tried: Array<"e621" | "yiffy2" | "femboyfans" | "iqdb" | "ffiqdb" | "saucenao"> = [];

    if (!Strings.validateURL(input)) {
        return null;
    }
    if (skipCheck === false) {
        const head = await RequestProxy.head(input);
        if (head.status !== 200 && head.status !== 204) {
            throw new PreCheckError(`A pre-check failed when trying to fetch the image "${input}".\nA \`HEAD\` request returned a non 2XX response (${head.status} ${STATUS_CODES[head.status] || "UNKNOWN"})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`);
        }
    }

    let match: RegExpExecArray | null;

    outer: {
        if ((match = yrRegex.exec(input))) {
            const res = await Yiffy.shortener.get(match[1]);
            if (res !== null) {
                input = res.fullURL;
            }
        }

        femboyfans: if ((match = femboyfansRegex.exec(input))) {
            tried.push("femboyfans");
            ffpost = await FemboyFans.getPostByMD5(match[1]);
            if (ffpost === null) {
                break femboyfans;
            }

            method = "femboyfans";
            break outer;
        }

        e621: if ((match = e621Regex.exec(input))) {
            tried.push("e621");
            post = await E621.posts.getByMD5(match[1]);
            if (post === null) {
                break e621;
            }

            method = "e621";
            break outer;
        }

        yiffy2: if ((match = yiffy2Regex.exec(input))) {
            tried.push("yiffy2");
            const yapi = await fetch(`https://v2.yiff.rest/images/${match[1]}`, {
                headers: {
                    "User-Agent": Config.userAgent
                }
            })
                .then(res => res.json() as Promise<{ data: JSONResponse; success: true; }>)
                .catch(() => null);
            if (yapi === null || !yapi.success) {
                break yiffy2;
            }

            const ffSource = yapi.data.sources.find(s => s.startsWith("https://femboy.fan/posts/"));
            const e6Source = yapi.data.sources.find(s => s.startsWith("https://e621.net/posts/"));

            if (ffSource !== undefined && (match = /https:\/\/femboy\.fan\/posts\/(\d+)/.exec(ffSource))) {
                ffpost = await FemboyFans.getPost(Number(match[1]));
                method = "femboyfans";
                break outer;
            }
            if (e6Source !== undefined && (match = /https:\/\/e621\.net\/posts\/(\d+)/.exec(e6Source))) {
                post = await E621.posts.get(Number(match[1]));
                method = "e621";
                break outer;
            }
            method = "yiffy2";
            sourceOverride = yapi.data.sources;
            break outer;
        }

        iqdb: {
            const img = await RequestProxy.get(input);
            if (!img.ok) {
                break iqdb;
            }

            const content = Buffer.from(await img.response.arrayBuffer());
            const type = await fileTypeFromBuffer(content);
            if (!type || !["image/png", "image/jpeg", "image/webp"].includes(type.mime)) {
                break iqdb;
            }

            ffiqdb: {
                tried.push("ffiqdb");
                const result = await FemboyFans.queryIQDB(content, similarity);
                if (result === null) {
                    break ffiqdb;
                }

                method = "ffiqdb";
                ffpost = await FemboyFans.getPost(result.post_id);
                saucePercent = result.score;
                break outer;
            }

            e6iqdb: {
                if (type.mime === "image/webp") {
                    break e6iqdb; // e621 does not support webp
                }
                tried.push("iqdb");
                const body = new FormData();
                const image = await Util.convertImageIQDB(content);
                body.append("file", new Blob([image], { type: type.mime }));
                const result = await fetch(`https://e621.net/iqdb_queries.json?search[score_cutoff]=${similarity}`, {
                    method:  "POST",
                    body,
                    headers: {
                        "Authorization": `Basic ${Buffer.from(`${Config.e621User}:${Config.e621APIKey}`).toString("base64")}`,
                        "User-Agent":    Config.userAgent
                    }
                });

                if (result.status !== 200) {
                    break e6iqdb;
                }

                const results = ((await result.json()) as { posts: Array<{ post_id: number; score: number; }>; }).posts;
                const res = results.sort((a, b) => b.score - a.score).at(0) ?? null;

                if (res === null) {
                    break e6iqdb;
                }

                method = "iqdb";
                post = await E621.posts.get(res.post_id);
                saucePercent = res.score;
                break outer;
            }
        }

        saucenao: {
            // saucenao is fucky and their api sucks
            if (skipSauceNao) {
                break saucenao;
            }

            tried.push("saucenao");
            const sn = await SauceNAO(input, [29, 40, 41, 42]).catch(() => null);
            if (sn !== null && Array.isArray(sn) && sn.length !== 0) {
                const top = sn.sort((a, b)=> a.header.similarity - b.header.similarity).find(v => v.header.similarity >= similarity);
                if (top && top.data.ext_urls.length !== 0) {
                    method = "saucenao";
                    saucePercent = top.header.similarity;
                    sourceOverride = top.data.ext_urls;
                    break outer;
                }
            }

            if (sn === "RateLimited") {
                snRateLimited = true;
            }
        }
    }

    if (post && post.flags.deleted && post.relationships.parent_id !== null) {
        const parent = await E621.posts.get(post.relationships.parent_id);
        if (parent !== null) {
            post = parent;
        }
    }

    if (ffpost && ffpost.flags.deleted && ffpost.relationships.parent_id !== null) {
        const parent = await FemboyFans.getPost(ffpost.relationships.parent_id);
        if (parent !== null) {
            ffpost = parent;
        }
    }

    return {
        method,
        tried,
        post,
        ffpost,
        saucePercent,
        sourceOverride,
        snRateLimited,
        url: input
    };
}

export async function directMD5(md5: string) {
    let post: Post | null = null, ffpost: FemboyFans.Post | null = null,
        method: "e621" | "yiffy2" | "femboyfans" | null = null,
        sourceOverride: string | Array<string> | undefined,
        url: string | null = null;

    outer: {
        femboyfans: {
            ffpost = await FemboyFans.getPostByMD5(md5);
            if (ffpost === null) {
                break femboyfans;
            }

            if (ffpost.flags.deleted && ffpost.relationships.parent_id !== null) {
                ffpost = await FemboyFans.getPost(ffpost.relationships.parent_id);
            }

            method = "femboyfans";
            break outer;
        }

        e621: {
            post = await E621.posts.getByMD5(md5);
            if (post === null) {
                break e621;
            }

            if (post.flags.deleted && post.relationships.parent_id !== null) {
                post = await E621.posts.get(post.relationships.parent_id);
            }

            method = "e621";
            break outer;
        }

        yiffy2: {
            const yapi = await Yiffy.images.getImage(md5);

            if (yapi === null) {
                break yiffy2;
            }

            const ffSource = yapi.sources.find(s => s.startsWith("https://femboy.fan/posts/"));
            const e6Source = yapi.sources.find(s => s.startsWith("https://e621.net/posts/"));

            let match: RegExpExecArray | null;
            if (ffSource !== undefined && (match = /https:\/\/femboy\.fan\/posts\/(\d+)/.exec(ffSource))) {
                ffpost = await FemboyFans.getPost(Number(match[1]));
                method = "femboyfans";
                break outer;
            }
            if (e6Source !== undefined && (match = /https:\/\/e621\.net\/posts\/(\d+)/.exec(e6Source))) {
                post = await E621.posts.get(Number(match[1]));
                method = "e621";
                break outer;
            }

            url = yapi.url;
            method = "yiffy2";
            sourceOverride = yapi.sources;
            break outer;
        }
    }

    if (method === null) {
        return null;
    }

    return {
        method,
        ffpost,
        post,
        sourceOverride,
        url
    };
}
