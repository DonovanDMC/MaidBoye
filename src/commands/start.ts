import Command from "../util/Command";
import { USERNAME } from "../util/Escape";

export default new Command("start", "Start using me", async(ctx) => {
	return ctx.reply([
		`Hi, @${USERNAME(ctx.from.username!)} \\- Here's how to use me`,
		"You can use /help to list my commands",
		"You can view my Discord counterpart [here](https://maid.gay)"
	].join("\n"), {
		parse_mode: "MarkdownV2"
	});
});
