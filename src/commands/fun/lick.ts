import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("lick")
	.setPermissions("bot", "embedLinks")
	.setDescription("Lick someone")
	.setUsage("<@user/text>")
	.addLiteApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to lick",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "lick");
	});
