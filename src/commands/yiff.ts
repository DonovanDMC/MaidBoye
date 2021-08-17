import Yiffy from "@util/Yiffy";
import ArgParse from "@util/ArgParse";
import Command from "@util/Command";
import { GetSettings } from "@util/Settings";
import YIFF from "yiffy/build/src/Endpoints/Yiff";
// all of the valid types are getters
const types = Object.entries(Object.getOwnPropertyDescriptors(YIFF.prototype)).filter(([k, v]) => typeof v.get === "function" && k !== "debug").reduce((a,b) => a.concat(b[0]), [] as Array<string>);
export default new Command("yiff", "Get some yiff", async(ctx) => {
	const { namedArgs: args } = ArgParse(ctx.message.text, ["type"]);
	if(ctx.chat.type !== "private" && !GetSettings(ctx.chat.id)) return ctx.reply(`NSFW commands are not enabled, enable them with /settings nsfw enabled\\.`);
	if(args.type && !types.includes(args.type.toLowerCase())) return ctx.reply(`Invalid yiff type\\.\\.\nValid Types: **${types.join("**, **")}**`);
	// telegram photos are a bitch
	/* return ctx.reply([
		`[Short URL](${img.shortURL}) \\- ${img.sources.length === 0 ? "[No Source]" : `[Source](${img.sources[0]})`}`,
		"",
		img.url.replace(/\./g, "\\.")
	].join("\n")) */
	let i = 0;
	async function attemptSend() {
		const img = await Yiffy.furry.yiff[(args.type ?? "gay").toLowerCase() as "gay"]("json", 1);
		if(!img) return ctx.reply("api request failed\\.\\.");
		void ctx.replyWithPhoto(img.url, {
			caption: `[Short URL](${img.shortURL}) \\- ${img.sources.length === 0 ? "[No Source]" : `[Source](${img.sources[0]})`} \\- Attempt ${++i}/5`,
			parse_mode: "MarkdownV2"
		})
		.catch(() => {
			if(i > 5) return ctx.reply("We failed to find a working image within 5 attempts\\.");
			else attemptSend();
		});
	}

	attemptSend();
});
