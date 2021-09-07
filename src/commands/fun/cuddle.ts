import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("cuddle")
	.setPermissions("bot", "embedLinks")
	.setDescription("Cuddle someone")
	.setUsage("<@user/text>")
	.addLiteApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to cuddle",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "cuddle");
	});
