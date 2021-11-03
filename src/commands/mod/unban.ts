import ModLogHandler from "@handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import Eris from "eris";

export default new Command("unban")
	.setPermissions("bot", "embedLinks", "banMembers")
	.setPermissions("user", "banMembers")
	.setDescription("Remove the ban for someone..")
	.setUsage("<@user> [reason]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to unban",
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for unbanning the user",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const user =  await msg.getUserFromArgs();
		if (user === null) return msg.reply("Th-that wasn't a valid user..");

		const reason = msg.args.length === 1 ? null : msg.args.slice(1).join(" ");
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		await msg.channel.guild.unbanMember(user.id, `Unban: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			.then(
				async() => {
					const mdl = await ModLogHandler.createUnBanEntry(msg.gConfig, user, msg.author, reason);
					if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
					return msg.channel.createMessage(`**${user.tag}** was softbanned, ***${reason ?? "None Provided"}***${mdl.check !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
				},
				async(err: Error) =>
					msg.reply(`I-I failed to unban **${user.tag}**..\n\`${err.name}: ${err.message}\``)
			);
	});
