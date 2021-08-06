import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("boop")
	.setPermissions("bot", "embedLinks")
	.setDescription("Boop someone")
	.setUsage("<@user/text>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to boop",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "boop");
	});
