import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("flop")
	.setPermissions("bot", "embedLinks")
	.setDescription("Flop onto someone")
	.setUsage("<@user/text>")
	.addLiteApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to flop on",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "flop");
	});
