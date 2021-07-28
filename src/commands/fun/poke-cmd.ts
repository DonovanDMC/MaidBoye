import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";

export default new Command("poke", "annoy")
	.setPermissions("bot", "embedLinks")
	.setDescription("Poke someone")
	.setUsage("<@user/text>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		return BotFunctions.genericFunCommand.call(this, msg, cmd);
	});
