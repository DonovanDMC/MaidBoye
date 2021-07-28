import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("nuzzle")
	.setPermissions("bot", "embedLinks")
	.setDescription("Nuzzle someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
