import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("cuddle")
	.setPermissions("bot", "embedLinks")
	.setDescription("cuddle someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "cuddle");
	});
