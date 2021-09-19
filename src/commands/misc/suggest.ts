import { botSauce } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import ComponentHelper from "@util/components/ComponentHelper";

export default new Command("suggest", "bugreport")
	.setPermissions("bot", "embedLinks")
	.setDescription("Suggest something")
	.setUsage("<@user>")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "type",
			description: "The type of suggestion to make",
			choices: [
				{
					name: "New Feature",
					value: "feature"
				},
				{
					name: "Bug Report",
					value: "bug"
				}
			],
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "title",
			description: "The title of the suggestion",
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "description",
			description: "The description of the suggestion",
			required: true
		}
	])
	.setParsedFlags("title", "description")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length > 0) {
			if (!["feature", "bug"].includes(msg.args[0].toLowerCase())) return msg.reply("H-hey! That was an invalid suggestion type..");
		}
	});
