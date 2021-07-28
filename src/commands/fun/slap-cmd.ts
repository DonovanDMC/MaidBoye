import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("slap")
	.setPermissions("bot", "embedLinks")
	.setDescription("Slap someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
