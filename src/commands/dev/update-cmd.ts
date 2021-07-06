import Command from "../../util/cmd/Command";
import Logger from "../../util/Logger";
import { execSync } from "child_process";

export default new Command("update")
	.setRestrictions("developer")
	.setDescription("Pull my code from github")
	.setExecutor(async function(msg) {
		try {
			const out = execSync("git pull");
			const noChanges = out.includes("Already up to date.");
			const exit = msg.dashedArgs.value.includes("exit");
			await msg.reply(`Success.${exit ? noChanges ? " No changes were made, not exiting." : " Changes were made, exiting." : ""}\n\`\`\`sh\n${out.toString()}\`\`\``);
			await msg.channel.sendTyping();
			if (exit && !noChanges) setTimeout(() => process.exit(0), 5e3);
		} catch (e) {
			Logger.getLogger("UpdateCommand").error("Update Error", e);
			return msg.reply("There was an error, check the console.");
		}
	});
