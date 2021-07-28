import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("bellyrub")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Rub someone's belly")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
