import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import Eris from "eris";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("mute")
	.setPermissions("bot", "embedLinks", "manageRoles")
	.setPermissions("user", "voiceMuteMembers")
	.setDescription("keep someone from talking")
	.setUsage(async function(msg) {
		return {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Command Help")
					.setDescription(
						`Permanent: \`${msg.gConfig.getFormattedPrefix()}mute <@user> [reason]\``,
						`Timed: \`${msg.gConfig.getFormattedPrefix()}mute <@user> [reason] "2 days"\``,
						"Time can be generally any word format (English only, quotes are required)",
						"",
						"We will attempt to send them a direct message. To disable that, add `--nodm`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}mute <@user> [reason] --nodm\``
					)
					.toJSON()
			]
		};
	})
	.setHasSlashVariant(true)
	.setSlashCommandOptions([
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to mute",
			required: true
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "reason",
			description: "The reason for muting the user",
			required: false
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "time",
			description: "The time until the mute expires (ex: 2 days)",
			required: false
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "no-dm",
			description: "If we should attempt to dm the muted user with some info",
			required: false,
			choices: [
				{
					name: "Yes",
					value: ""
				},
				{
					name: "No",
					value: "--nodm"
				}
			]
		}
	])
	.setCooldown(3e3)
	.setParsedFlags("nodm")
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
		const nodm = msg.dashedArgs.value.includes("nodm");
		const member =  await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");

		if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
		if (member.id === msg.channel.guild.ownerID) return msg.reply("Y-you can't mute the server owner!");
		const compare = msg.member.compareToMember(member);
		if (["higher","same"].includes(compare) && msg.member.id !== msg.channel.guild.ownerID) return msg.reply("Th-that user is higher than, or as high as your highest role.. You cannot mute them");
		const compareMe = msg.channel.guild.me.compareToMember(member);
		if (["higher","same"].includes(compareMe)) return msg.reply("Th-that user is higher than, or as high as my highest role.. I cannot mute them");
		if (member.roles.includes(r.id)) return msg.reply("Th-that member is already muted..");

		let time = Time.parseTime2(msg.args[msg.args.length - 1]), reason: string | null = null;
		if (msg.args.length !== 1) {
			if (time === 0) {
				time = Time.parseTime2(msg.args.join(" "));
				reason = msg.args.slice(1).join(" ");
			} else reason = msg.args.slice(1, -1).join(" ");
			if (time < 1000) time = 0;
		}

		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		let dmError: string | undefined;
		let dm: Eris.Message<Eris.PrivateChannel> | null = null;
		if (!nodm && member !== null && !member.bot)
			dm = await member.user.createMessage(`You were muted in **${msg.channel.guild.name}** by **${msg.author.tag}**\nReason:\n\`\`\`\n${reason ?? "None Provided"}\`\`\`\nTime: **${time === 0 ? "Permanent" : Time.ms(time, true, true, false)}**`)
				.catch((err: Error) => ((dmError = `${err.name}: ${err.message}`, null)));
		await member.addRole(r.id, `Mute: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			// catch first so we only catch an error from ban
			.catch(async(err: Error) => {
				// delete the dm if we didn't ban them
				if (dm !== null) await dm.delete().catch(() => null);
				return msg.channel.createMessage(`I-I failed to mute **${member.tag}**..\n\`${err.name}: ${err.message}\``);
			})
			.then(async() => {
				const mdl = await ModLogHandler.createMuteEntry(msg.gConfig, member, msg.author, reason, time);
				return msg.channel.createMessage(`**${member.tag}** was muted ${time === 0 ? "permanently" : `for \`${Time.ms(time, true, true, false)}\``}, ***${reason ?? "None Provided"}***${dmError !== undefined ? `\n\nFailed to send dm:\n\`${dmError}\`` : ""}${mdl !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
			});
	});
