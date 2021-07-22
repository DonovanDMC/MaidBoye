import Command from "@cmd/Command";
import BotFunctions from "@util/BotFunctions";
import CommandError from "@util/cmd/CommandError";
import EmbedBuilder from "@util/EmbedBuilder";
import ModLogHandler from "@util/handlers/ModLogHandler";
import Logger from "@util/Logger";

export default new Command("reason")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageMessages")
	.setDescription("change a cases reason")
	.setUsage("<case> <newReason>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setParsedFlags("force")
	.setExecutor(async function(msg, cmd) {
		const check = await ModLogHandler.check(msg.gConfig);
		if (check === false)  return msg.reply("Th-the modlog isn't enabled here..");
		if (msg.gConfig.modlog.caseEditingEnabled === false) return msg.reply("Case editing is disabled.");
		if (msg.args.length < 2) return new CommandError("INVALID_USAGE", cmd);
		const n = Number(msg.args[0]);
		const reason = msg.args.slice(1).join(" ");
		if (isNaN(n) || n < 1) return msg.reply("Th-that wasn't a valid case number..");
		const c = await msg.gConfig.getModlogEntry(n);
		if (c === null) return msg.reply(`I-I couldn't find a case with the number **${n}**..`);
		if (msg.gConfig.modlog.editOthersCasesEnabled === false && c.blame !== msg.author.id) return msg.reply("H-hey! That isn't your case, and **Edit Others Cases** isn't enabled..");
		const m = await c.getMessage(this);
		if (c.reason === reason && !msg.dashedArgs.value.includes("force")) return msg.reply("Th-that's the same reason as the current one.. If you want to force an update, add `--force` to the end of the commnd.");
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");
		let editError = false;
		if (m !== null) {
			const e = new EmbedBuilder(false, undefined, m.embeds[0]);
			e.setDescription(
				e.getDescription()!.split("\n").map(d => {
					if (d.startsWith("Reason")) return `Reason: **${reason}**`;
					if (d.startsWith("Last Edit")) return `Last Edit: by **${msg.author.tag}** on ${BotFunctions.formatDiscordTime(Date.now(), "short-datetime", true)}`;
					return d;
				}),
				e.getDescription()!.includes("Last Edit") ? "" : `Last Edit: by **${msg.author.tag}** on ${BotFunctions.formatDiscordTime(Date.now(), "short-datetime", true)}`
			);
			await this.editWebhookMessage(msg.gConfig.modlog.webhook!.id, msg.gConfig.modlog.webhook!.token, m.id, {
				embeds: [
					e.toJSON()
				]
			}).catch((err) => {
				Logger.getLogger("ReasonCommand").error(err);
				editError = true;
			});
		} else editError = true;

		await c.edit(reason, msg.author.id);
		if (editError === true) return msg.reply("We failed to fetch the modlog message, so the case has only been updated on our side.");
		else return msg.reply("Case successfully updated.");
	});
