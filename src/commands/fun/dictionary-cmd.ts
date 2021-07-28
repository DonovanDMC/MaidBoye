import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("dictionary")
	.setPermissions("bot", "embedLinks")
	.setDescription("Throw the dictionary at someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
