import ArgParse from "@util/ArgParse";
import Command from "@util/Command";
import { GetSettings, EditSettings } from "@util/Settings";

export default new Command("settings", "Configure my settings", async(ctx) => {
	const { namedArgs: args } = ArgParse(ctx.message.text, ["name", "value"]);
	// ctx.getChatMember()
	if(ctx.chat.type === "private") return ctx.reply("This command cannot be used in private channels\\.");
	else {
		const member = await ctx.getChatMember(ctx.from.id);
		if(!["creator", "administrator"].includes(member.status)) return ctx.reply("You cannot use this command\\.");
		const set = GetSettings(ctx.chat.id);
		switch(args.name?.toLowerCase()) {
			case "nsfw": {
				if(args.value === undefined) return ctx.reply(`**NSFW** is currently \`${set.nsfw ? "Enabled" : "Disabled"}\``);
				const { nsfw: newValue } = EditSettings(ctx.chat.id, "nsfw", args.value.toLowerCase() === "enabled");
				return ctx.reply(`**NSFW** has been set to \`${newValue ? "Enabled" : "Disabled"}\``);
				break;
			}

			default: return ctx.reply("Valid settings:\n\\- **NSFW**");
		}
	}
});
