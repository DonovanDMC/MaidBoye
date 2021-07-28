import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("snowball")
	.setPermissions("bot", "embedLinks")
	.setDescription("Throw a snowball at someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
