import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("blep")
	.setPermissions("bot", "embedLinks")
	.setDescription("Stick your tongue out")
	.setUsage("<@user/text>")
	.addLiteApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "blep");
	});
