import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("unmute")
	.setPermissions("bot", "embedLinks", "manageRoles", "voiceMuteMembers")
	.setPermissions("user", "voiceMuteMembers")
	.setDescription("undo a mute")
	.setUsage("<user> [reason]")
	.setHasSlashVariant(true)
	.setSlashCommandOptions([
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to unmute",
			required: true
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "reason",
			description: "The reason for unmuting the user",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		if (msg.gConfig.settings.muteRole === null) return msg.reply(`Th-this server's mute role hasn't been set up.. Try \`${msg.gConfig.getFormattedPrefix()}settings\``);
		const r = msg.channel.guild.roles.get(msg.gConfig.settings.muteRole);
		if (!r) {
			await msg.gConfig.edit({
				settings: {
					muteRole: null
				}
			});
			return msg.reply("Th-this server's mute role is invalid..");
		}
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const member =  await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");

		if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
		const compareMe = msg.channel.guild.me.compareToMember(member);
		if (["higher","same"].includes(compareMe)) return msg.reply("Th-that user is higher than, or as high as my highest role.. I cannot unmute them");
		if (!member.roles.includes(r.id)) return msg.reply("Th-that member is not muted..");

		const reason = msg.args.length === 1 ? null : msg.args.slice(1).join(" ");

		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		await member.removeRole(r.id, `Unmute: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			.catch(async(err: Error) => msg.channel.createMessage(`I-I failed to unmute **${member.tag}**..\n\`${err.name}: ${err.message}\``))
			.then(async() => {
				if (member.voiceState.channelID !== null) {
					try {
						await member.edit({ mute: false }, `Unmute: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
					} catch {
						// they need to be in a voice channel for this to work
					}
				}
				const mdl = await ModLogHandler.createUnMuteEntry(msg.gConfig, member, msg.author, reason);
				return msg.channel.createMessage(`**${member.tag}** was unmuted, ***${reason ?? "None Provided"}***${mdl.check !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
			});
	});
