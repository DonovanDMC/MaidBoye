import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("huff")
	.setPermissions("bot", "embedLinks")
	.setDescription("Blow someone's house down")
	.setUsage("<@user/text>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
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
