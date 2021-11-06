import Command from "@cmd/Command";
import Eris from "eris";
import Sauce from "@util/Sauce";
import StatsHandler from "@util/handlers/StatsHandler";


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
		let sim = 75;
		if ("similarity" in msg.dashedArgs.keyValue) {
			sim = Number(msg.dashedArgs.keyValue.similarity);
			if (sim < 0) return msg.reply("Minimum similarity must be more than zero.");
			if (sim > 100) return msg.reply("Minimum similarity must be less than 100.");
		}
		const sauce = await Sauce(msg.args.join(" "), sim);
		if (sauce === null) return msg.reply("H-hey! The provided url is invalid..");
		const { method, tried, post, saucePercent, sourceOverride, snRateLimited, url } = sauce;

		if (snRateLimited) return msg.reply(`SauceNAO is ratelimiting us, so we couldn't try SauceNAO, we tried these instead: \`${tried.join("`, `")}\``);
		if (method !== undefined) StatsHandler.trackNoResponse("stats:source:cmd");
		if (method === "e621" && post !== null) {
			StatsHandler.trackNoResponse("stats:source:cmd:e621");
			if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("The sauce we found isn't rated as safe, please rerun in an nsfw channel..");
			return msg.reply(`We found these sources via direct md5 lookup on e621\nLookup: <${url}>\n\nResults:\nhttps://e621.net/posts/${post.id}\n${post.sources.map(v => `<${v}>`).join("\n")}`);
		} else if (method === "yiffy2" && sourceOverride) {
			// we will only get to yiffy2 for YiffyAPI V2 images without an e621 source, other images end up being process like md5 lookups
			StatsHandler.trackNoResponse("stats:source:cmd:yiffy2");
			if (!msg.channel.nsfw) return msg.reply("Unable to determine if sauce is nsfw, please rerun in an nsfw channel..");
			else return msg.reply(`We found these sources via direct md5 lookup on YiffyAPI V2\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride]).map((v, i) => i === 0 ? v : `<${v}>`).join("\n")}`);
		} else if (method === "yiffy3" && post !== null) {
			StatsHandler.trackNoResponse("stats:source:cmd:yiffy3");
			if (post.rating !== "s" && !msg.channel.nsfw) return msg.reply("The sauce we found isn't rated as safe, please rerun in an nsfw channel..");
			return msg.reply(`We found these sources via direct md5 lookup on YiffyAPI V3\nLookup: <${url}>\n\nResults:\nhttps://yiff.rest/posts/${post.id}\n${post.sources.map(v => `<${v}>`).join("\n")}`);
		} else if (method === "saucenao" && sourceOverride) {
			StatsHandler.trackNoResponse("stats:source:cmd:saucenao");
			if (!msg.channel.nsfw) return msg.reply("Unable to determine if sauce is nsfw, please rerun in an nsfw channel..");
			return msg.reply(`We found these sources via a reverse image search on saucenao (similarity: ${saucePercent}%)\nLookup: <${url}>\n\nResults:\n${(Array.isArray(sourceOverride) ? sourceOverride : [sourceOverride]).map((v, i) => (i === 0 ? v : `<${v}>`).replace(/posts\/show/, "posts" /* legacy */)).join("\n")}`);
		} else return msg.reply(`We tried our best, but couldn't find anything...\nAttempted Methods: \`${tried.join("`, `")}\`\n\nNote: We automatically remove any saucenao results with less than 75% similarity to avoid false positives, to set your own thresold, use the \`--similarity=XXX\` flag`);
	});
