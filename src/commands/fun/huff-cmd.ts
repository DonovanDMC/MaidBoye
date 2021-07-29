import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("huff")
	.setPermissions("bot", "embedLinks")
	.setDescription("Blow someone's house down")
	.setUsage("<@user/text>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			// @FIXME grammar
			description: "The user of whose house you want to blow down",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
