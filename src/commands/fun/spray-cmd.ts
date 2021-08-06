import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("spray")
	.setPermissions("bot", "embedLinks")
	.setDescription("Spray someone with water")
	.setUsage("<@user/text>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to spray",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
