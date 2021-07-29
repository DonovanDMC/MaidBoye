import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("sniff")
	.setPermissions("bot", "embedLinks")
	.setDescription("sniff someone")
	.setUsage("<@user/text>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to sniff",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
