import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("bap")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Bap someone on the snoot")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
