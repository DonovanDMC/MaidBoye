import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import { ApplicationCommandOptionType } from "discord-api-types";

export default new Command("softban")
	.setPermissions("bot", "embedLinks", "banMembers")
	.setPermissions("user", "banMembers")
	.setDescription("Ban and then unban someone from the server..")
	.setUsage(async function(msg) {
		return {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Command Help")
					.setDescription(
						"(`softban` does not accept time, use `ban` for that)",
						`Permanent: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason]\``,
						"",
						"We will attempt to send them a direct message. To disable that, add `--nodm`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason] --nodm\``,
						"",
						"1 day of messages is deleted by default, to change that, provide `--deldays=<1-7>`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason] --deldays=1\``
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
			description: "The user to softban",
			required: true
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "reason",
			description: "The reason for softbanning the user",
			required: false
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "no-dm",
			description: "If we should attempt to dm the softbanned user with some info",
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
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "delete-days",
			description: "The amount of days of messages that should be deleted",
			choices: new Array(8).fill(null).map((_, i) => ({
				name: String(i),
				value: `--deldays=${i}`
			})),
			required: false
		}
	])
	.setCooldown(3e3)
	.setParsedFlags("nodm", "deldays")
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		const nodm = msg.dashedArgs.value.includes("nodm");
		let delDays = Number(msg.dashedArgs.keyValue.deldays);
		if (isNaN(delDays)) delDays = 1;
		const member =  await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");

		if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
		if (member.id === msg.channel.guild.ownerID) return msg.reply("Y-you can't softban the server owner!");
		const compare = msg.member.compareToMember(member);
		if (["higher","same"].includes(compare) && msg.member.id !== msg.channel.guild.ownerID) return msg.reply("Th-that user is higher than, or as high as your highest role.. You cannot softban them");
		const compareMe = msg.channel.guild.me.compareToMember(member);
		if (["higher","same"].includes(compareMe)) return msg.reply("Th-that user is higher than, or as high as my highest role.. I cannot softban them");

		const reason = msg.args.length === 1 ? null : msg.args.slice(1).join(" ");

		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		let dmError: string | undefined;
		let dm: Eris.Message<Eris.PrivateChannel> | null = null;
		if (!nodm && member !== null && !member.bot)
			dm = await member.user.createMessage(`You were softbanned from **${msg.channel.guild.name}** by **${msg.author.tag}**\nReason:\n\`\`\`\n${reason ?? "None Provided"}\`\`\`\nWe are not responsible for inviting you back, contact a server staff member.`)
				.catch((err: Error) => ((dmError = `${err.name}: ${err.message}`, null)));
		await member.ban(delDays, `SoftBan: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			// catch first so we only catch an error from ban
			.catch(async(err: Error) => {
				// delete the dm if we didn't ban them
				if (dm !== null) await dm.delete().catch(() => null);
				return msg.channel.createMessage(`I-I failed to ban **${member.tag}**..\n\`${err.name}: ${err.message}\``);
			})
			.then(async() => {
				await member.unban(`SoftBan: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
			})
			.catch(async(err: Error) =>
				msg.channel.createMessage(`I-I failed to unban **${member.tag}**..\n\`${err.name}: ${err.message}\``)
			)
			.then(async() => {
				const mdl = await ModLogHandler.createSoftBanEntry(msg.gConfig, member, msg.author, reason, delDays);
				return msg.channel.createMessage(`**${member.tag}** was softbanned, ***${reason ?? "None Provided"}***${dmError !== undefined ? `\n\nFailed to send dm:\n\`${dmError}\`` : ""}${mdl.check !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
			});
	});
