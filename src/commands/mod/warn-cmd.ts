import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import UserConfig from "@db/Models/User/UserConfig";
import Eris from "eris";

export default new Command("warn")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "kickMembers")
	.setDescription("warn a user for something they're doing")
	.setUsage("<user> [reason]")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to warn",
			required: true
		},
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for warning the user",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const member =  await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");

		if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
		if (member.id === msg.channel.guild.ownerID) return msg.reply("Y-you can't warn the server owner!");
		const compare = msg.member.compareToMember(member);
		if (["higher","same"].includes(compare) && msg.member.id !== msg.channel.guild.ownerID) return msg.reply("Th-that user is higher than, or as high as your highest role.. You warn mute them");

		const reason = msg.args.length === 1 ? null : msg.args.slice(1).join(" ");

		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		const current = await UserConfig.prototype.getWarningCount.call({ id: member.id }, msg.channel.guild.id);
		if (current > 100) return msg.reply("H-hey! That user has the maimum amount of warnings!");

		const w = await UserConfig.prototype.addWarning.call({ id: member.id }, msg.channel.guild.id, msg.author.id, reason);
		const mdl = await ModLogHandler.createWarnEntry(msg.gConfig, member, msg.author, reason, w);
		return msg.reply(`**${member.tag}** was warned, ***${reason ?? "None Provided"}***${mdl.check !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
	});
