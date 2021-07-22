import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("kick")
	.setPermissions("bot", "embedLinks", "kickMembers")
	.setPermissions("user", "kickMembers")
	.setDescription("Forcefully remove someone from this server..")
	.setUsage(async function(msg) {
		return {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Command Help")
					.setDescription(
						`Permanent: \`${msg.gConfig.getFormattedPrefix()}kick <@user> [reason]\``,
						"",
						"We will attempt to send them a direct message. To disable that, add `--nodm`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}kick <@user> [reason] --nodm\``
					)
					.toJSON()
			]
		};
	})
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setParsedFlags("nodm")
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const nodm = msg.dashedArgs.value.includes("nodm");
		const member =  await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");

		if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
		if (member.id === msg.channel.guild.ownerID) return msg.reply("Y-you can't kick the server owner!");
		const compare = msg.member.compareToMember(member);
		if (["higher","same"].includes(compare) && msg.member.id !== msg.channel.guild.ownerID) return msg.reply("Th-that user is higher than, or as high as your highest role.. You cannot kick them");
		const compareMe = msg.channel.guild.me.compareToMember(member);
		if (["higher","same"].includes(compareMe)) return msg.reply("Th-that user is higher than, or as high as my highest role.. I cannot kick them");
		const reason = msg.args.slice(1).join(" ");

		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		let dmError: string | undefined;
		let dm: Eris.Message<Eris.PrivateChannel> | null = null;
		if (!nodm && member !== null && !member.bot)
			dm = await member.user.createMessage(`You were kicked from **${msg.channel.guild.name}** by **${msg.author.tag}**\nReason:\n\`\`\`\n${reason ?? "None Provided"}\`\`\``)
				.catch((err: Error) => ((dmError = `${err.name}: ${err.message}`, null)));
		await member.kick(`Kick: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			// catch first so we only catch an error from ban
			.catch(async(err: Error) => {
				// delete the dm if we didn't ban them
				if (dm !== null) await dm.delete().catch(() => null);
				return msg.channel.createMessage(`I-I failed to kick **${member.tag}**..\n\`${err.name}: ${err.message}\``);
			})
			.then(async() => {
				const mdl = await ModLogHandler.createKickEntry(msg.gConfig, member, msg.author, `Ban: ${msg.author.tag} -> ${reason ?? "None Provided"}`);
				return msg.channel.createMessage(`**${member.tag}** was kicked, ***${reason ?? "None Provided"}***${dmError !== undefined ? `\n\nFailed to send dm:\n\`${dmError}\`` : ""}${mdl !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
			});
	});
