import E621, { YiffyV3 } from "@util/req/E621";
import SauceNAO from "@util/req/SauceNAO";
import Command from "@cmd/Command";
import Eris from "eris";
import type { Post } from "e621";
import fetch from "node-fetch";
import { apiKeys, userAgent } from "@config";
import type { JSONResponse } from "yiffy";


// I didn't rewrite this command because it isn't that old (less than 3 months)
export default new Command("sauce")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get the sauce for an image")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "url",
			description: "The url of the image to search for",
			required: true
		}
	])
	.setUsage("<url>")
	.setCooldown(5e3)
	.setParsedFlags("similarity")
	// ratings
	.setExecutor(async function(msg) {
		// I could include file extensions, but I couldn't be bothered since I only need the md5
		// E621 - e621.net - primary e621ng
		const e621Regex = /(?:https?:\/\/)?static\d\.(?:e621|e926)\.net\/data\/(?:sample\/)?(?:[a-z\d]{2}\/){2}([a-z\d]+)\.[a-z]+/;
		// YiffyAPI V2 - v2.yiff.rest - other
		const yiffyRegex_2 = /(?:https?:\/\/)?(?:v2\.yiff\.media|yiff\.media\/V2)\/(?:.*\/)+([a-z\d]+)\.[a-z]+/;
		// YiffyAPI V3 - yiff.rest - modified e621ng instance
		const yiffyRegex_3 = /(?:https?:\/\/)?(?:v3\.yiff\.media|yiff\.media\/V3)\/(?:sample\/)?(?:[a-z\d]{2}\/){2}([a-z\d]+)\.[a-z]+/;
		let url = msg.args.join(" "), sim = 75;
		// for disabling embeds
		if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);
		let post: Post | null = null,
			method: "e621" | "yiffy2" | "yiffy3" | "saucenao" | undefined,
			sourceOverride: string | Array<string> | undefined,
			saucePercent = 0;
		const tried: Array<string> = [];
		if ("similarity" in msg.dashedArgs.keyValue) {
			sim = Number(msg.dashedArgs.keyValue.similarity);
			if (sim < 0) return msg.reply("Minimum similarity must be more than zero.");
			if (sim > 100) return msg.reply("Minimum similarity must be less than 100.");
		}
		if (url) {
			// url
			if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(url)) {
				const head = await fetch(`https://proxy-request.yiff.workers.dev/?url=${encodeURIComponent(url)}`, {
					method: "HEAD",
					headers: {
						"User-Agent": userAgent,
						"Authorization": apiKeys.proxyReq
					}
				});
				if (head.status !== 200 && head.status !== 204) return msg.reply(`A pre-check failed when trying to fetch the image "<${url}>".\nA \`HEAD\` request returned a non 200 OK/204 No Content responses (${head.status} ${head.statusText})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`);

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
					if (sa !== null && sa.length !== 0) {
						const top = sa.sort((a,b)=> a.header.similarity - b.header.similarity).find(v => v.header.similarity >= sim);
						if (top && top.data.ext_urls.length > 0) {
							method = "saucenao";
							saucePercent = top.header.similarity;
							sourceOverride = top.data.ext_urls;
						}
					}
				}

				// debug
				// console.log(post?.id, e6, y2, y3, method, sourceOverride, saucePercent, tried);

				if (method === "e621" && post !== null) {
					if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("The sauce we found isn't rated as safe, please rerun in an nsfw channel..");
					return msg.reply(`We found these sources via direct md5 lookup on e621\nLookup: <${url}>\n\nResults:\nhttps://e621.net/posts/${post.id}\n${post.sources.map(v => `<${v}>`).join("\n")}`);
				} else if (method === "yiffy2" && sourceOverride) {
					// we will only get to yiffy2 for YiffyAPI V2 images without an e621 source, other images end up being process like md5 lookups
					if (!msg.channel.nsfw) return msg.reply("Unable to determine if sauce is nsfw, please rerun in an nsfw channel..");
					else return msg.reply(`We found these sources via direct md5 lookup on YiffyAPI V2\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride]).map((v, i) => i === 0 ? v : `<${v}>`).join("\n")}`);
				} else if (method === "yiffy3" && post !== null) {
					if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("The sauce we found isn't rated as safe, please rerun in an nsfw channel..");
					return msg.reply(`We found these sources via direct md5 lookup on YiffyAPI V3\nLookup: <${url}>\n\nResults:\nhttps://yiff.rest/posts/${post.id}\n${post.sources.map(v => `<${v}>`).join("\n")}`);
				} else if (method === "saucenao" && sourceOverride) {
					if (!msg.channel.nsfw) return msg.reply("Unable to determine if sauce is nsfw, please rerun in an nsfw channel..");
					return msg.reply(`We these sources via a reverse image search on saucenao (similarity: ${saucePercent}%)\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride]).map((v, i) => (i === 0 ? v : `<${v}>`).replace(/posts\/show/, "posts" /* legacy */)).join("\n")}`);
				} else return msg.reply(`We tried our best, but couldn't find anything...\nAttempted Methods: \`${tried.join("`, `")}\`\n\nNote: We automatically remove any saucenao results with less than 75% similarity to avoid false positives, to set your own thresold, use the \`--similarity=XXX\` flag`);
			} else return msg.reply("H-hey! The provided url is invalid..");
		} else {
			if (msg.attachments.length === 0) return msg.reply("H-hey! You must provide an attachment, or a url..");

			// @TODO
		}

		/* if (post === null) return msg.reply(type === "MD5" ? "We couldn't find an image matching that on e621. You can try again with the `--saucenao` flag to do a reverse image search." : "We weren't able to find anything via a reverse image search. Try something else.");
		if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("H-hey! The returned post is not rated Safe, so we cannot display it in non-nsfw channels.");
		// https://${post.rating === "s" ? "e926" : "e621"}.net/posts/${post.id}
		return msg.reply(`We found this (${type === "MD5" ? "via direct md5 lookup" : "via reverse image search"}):\nhttps://${post.rating === "s" ? "e926" : "e621"}.net/posts/${post.id}`); */
	});
