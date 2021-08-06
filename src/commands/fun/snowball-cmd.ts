import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("snowball")
	.setPermissions("bot", "embedLinks")
	.setDescription("Throw a snowball at someone")
	.setUsage("<@user/text>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to throw a snowball at",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
