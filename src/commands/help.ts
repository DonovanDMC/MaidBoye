import Command from "@util/Command";
import bot from "..";

export default new Command("help", "List my commands", async(ctx) => {
	return ctx.reply([
		"Hi, I'm Maid Boye! This is my telegram variant, [Discord](https://maid.gay) is my primary platform.",
		"",
		"Here's a list of my commands:",
		...Array.from(bot.commands).map(([name, cmd]) => `/${name} - ${cmd.description}`),
		"",
		"Creator: [Donovan_DMC](https://donovan.is.gay)",
		"Twitter: [@MaidBoye](https://twitter.com/MaidBoye)",
		"If you want to help keep this project going, you can donate [here](https://ko-fi.com/MaidBoye)"
	].join("\n"), {
		parse_mode: "MarkdownV2"/* ,
		disable_web_page_preview: true */
		// kept on purpose
	});
});
