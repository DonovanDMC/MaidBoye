import Command from "../../util/cmd/Command";
import Logger from "../../util/Logger";
import { execSync } from "child_process";

export default new Command("update")
	.setRestrictions("developer")
	.setDescription("Pull my code from github")
	.setParsedFlags("exit")
	.setExecutor(async function(msg) {
		try {
			const out = execSync("git pull").toString();
			const latest = execSync("git log -1").toString().split("\n").map(line => `> ${line}`);
			latest[3] = "> Commit Message:";
			if (latest.length === 6) latest.splice(5);
			const noChanges = out.includes("Already up to date.");
			const exit = msg.dashedArgs.value.includes("exit");
			await msg.reply(`Success.${noChanges ? `No changes were made. ${exit ? " Not exiting." : ""}` : `${exit ? " Exiting in 2 seconds." : " Not exiting."}\n\nCommit Info:\n${latest.join("\n")}`}\n\`\`\`sh\nOutput:\n${out}\`\`\``);
			await msg.channel.sendTyping();
			if (exit && !noChanges) setTimeout(() => process.exit(0), 2e3);
		} catch (e) {
			Logger.getLogger("UpdateCommand").error("Update Error", e);
			return msg.reply("There was an error, check the console.");
		}
	});
