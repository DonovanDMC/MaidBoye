import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("hug")
	.setPermissions("bot", "embedLinks")
	.setDescription("Hug someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommandWithImage.call(this, msg, cmd, "hug");
	});
