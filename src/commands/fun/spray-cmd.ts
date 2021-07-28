import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("spray")
	.setPermissions("bot", "embedLinks")
	.setDescription("Spray someone with water")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
