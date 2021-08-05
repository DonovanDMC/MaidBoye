import E621 from "../../util/req/E621";
import Logger from "../../util/Logger";
import SauceNAO from "@util/req/SauceNAO";
import Command from "@cmd/Command";
import Eris from "eris";
import ExtendedMessage from "@util/ExtendedMessage";
import { SagiriResult } from "sagiri";
import { APIError, Post } from "e621";

async function sauce(url: string, msg: ExtendedMessage) {
	await msg.channel.sendTyping();
	let s: Array<SagiriResult>;
	try {
		s = await SauceNAO(url);
	} catch (er) {
		const err = er as Error;
		if (err.message.indexOf("file no longer exists") !== -1) {
			await msg.reply("H-hey! The file doesn't exist on the remote server..");
			return null;
		}
		throw err;
	}
	if (s.length === 0) {
		await msg.reply("Nothing was found..");
		return null;
	}
	let post: Post | null = null;
	try {
		post = await E621.getPostById(Number(s[0].raw.data.e621_id!)).catch(() => null);
	} catch (err) {
		if (err instanceof APIError) {
			Logger.getLogger(`SauceCommand[${msg.channel.guild.id}]`).error(err);
			return msg.reply(`We encountered an error while contacting e621: **${err.name}: ${err.message}**\nTry again later.`);
		} else throw err;
	}
	const type = "SauceNAO" as const;
	if (post === null) {
		await msg.reply("We weren't able to find anything via a reverse image search. Try something else.");
		return null;
	}

	return {
		post,
		type
	};
}

// I didn't rewrite this command because it isn't that old (less than 3 months)
export default new Command("sauce")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get the sauce for an image")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "url",
			description: "The url of the image to search for",
			required: true
		},
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "saucenao",
			description: "If we should use saucenao for searching",
			required: false,
			choices: [
				{
					name: "Yes",
					value: "--saucenao"
				},
				{
					name: "No",
					value: ""
				}
			]
		}
	])
	.setUsage("<url>")
	.setCooldown(5e3)
	.setParsedFlags("saucenao")
	.setExecutor(async function(msg) {
		// I could include file extensions, but I couldn't be bothered since I only need the md5
		const e621Regex = /(?:https?:\/\/)?static\d\.(?:e621|e926)\.net\/data\/(?:sample\/)(?:[a-z\d]{2}\/){2}([a-z\d]+)\.[a-z]+/;
		const yiffyRegex = /(?:https?:\/\/)?yiff\.media\/V2\/(?:.*\/)+([a-z\d]+)\.[a-z]+/;
		let c = msg.args.join(" ");
		// for disabling embeds
		if (c.startsWith("<") && c.endsWith(">")) c = c.slice(1, -1);
		const sn = msg.dashedArgs.value.includes("saucenao");
		let post: Post | null = null, type: "SauceNAO" | "MD5";
		if (c) {
			// url
			if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(c)) {
				const e = e621Regex.exec(c);
				const y = yiffyRegex.exec(c);
				const v = (e && e[1]) ?? (y && y[1]) ?? null;
				if (v) {
					if (sn) {
						const s = await sauce(v, msg);
						if (s === null) return;
						if (s instanceof Eris.Message) return s;
						post = s.post;
						type = s.type;
					} else {
						try {
							post = await E621.getPostByMD5(v);
						} catch (err) {
							if (err instanceof APIError) {
								Logger.getLogger(`SauceCommand[${msg.channel.guild.id}]`).error(err);
								return msg.reply(`We encountered an error while contacting e621: **${err.name}: ${err.message}**\nTry again later.`);
							} else throw err;
						}
						type = "MD5";
						if (post === null) return msg.reply("We couldn't find an image matching that on e621. You can try again with the `--saucenao` flag to do a reverse image search.");
					}

				} else {
					const s = await sauce(c, msg);
					if (s === null) return;
					if (s instanceof Eris.Message) return s;
					post = s.post;
					type = s.type;
				}
			} else return msg.reply("H-hey! The provided url is invalid");
		} else {
			if (msg.attachments.length === 0) return msg.reply("H-hey! You must provide an attachment, or a url..");

			const s = await sauce(msg.attachments[0].url, msg);
			if (s === null) return;
			if (s instanceof Eris.Message) return s;
			post = s.post;
			type = s.type;
		}

		if (post === null) return msg.reply(type === "MD5" ? "We couldn't find an image matching that on e621. You can try again with the `--saucenao` flag to do a reverse image search." : "We weren't able to find anything via a reverse image search. Try something else.");
		if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("H-hey! The returned post is not rated Safe, so we cannot display it in non-nsfw channels.");
		// https://${post.rating === "s" ? "e926" : "e621"}.net/posts/${post.id}
		return msg.reply(`We found this (${type === "MD5" ? "via direct md5 lookup" : "via reverse image search"}):\nhttps://${post.rating === "s" ? "e926" : "e621"}.net/posts/${post.id}`);
	});
