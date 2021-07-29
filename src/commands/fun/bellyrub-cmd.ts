import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("bellyrub")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Rub someone's belly")
	.setUsage("<@user/text>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to give a belly rub to",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
