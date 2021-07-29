import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("flop")
	.setPermissions("bot", "embedLinks")
	.setDescription("Flop onto someone")
	.setUsage("<@user/text>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to flop on",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "flop");
	});
