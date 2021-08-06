import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("pounce")
	.setPermissions("bot", "embedLinks")
	.setDescription("Pounce onto someone")
	.setUsage("<@user/text>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to pounce on",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
