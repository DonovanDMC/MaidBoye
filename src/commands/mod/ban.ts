import ModLogHandler from "@handlers/ModLogHandler";
import Command from "@cmd/Command";
import CommandError from "@cmd/CommandError";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import Eris from "eris";

export default new Command("ban")
	.setPermissions("bot", "embedLinks", "banMembers")
	.setPermissions("user", "banMembers")
	.setDescription("B-ban someone from this server..")
	.setUsage(async function(msg) {
		return {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Command Help")
					.setDescription(
						`Permanent: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason]\``,
						`Timed: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason] "2 days"\``,
						"Time can be generally any word format (English only, quotes are required)",
						"",
						"If the user is in the server, we attempt to send them a direct message. To disable that, add `--nodm`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason] --nodm\``,
						"",
						"1 day of messages is deleted by default, to change that, provide `--deldays=<0-7>`",
						`ex: \`${msg.gConfig.getFormattedPrefix()}ban <@user> [reason] --deldays=0\``
					)
					.toJSON()
			]
		};
	})
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to ban",
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for banning the user",
			required: false
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "time",
			description: "The time until the ban expires (ex: 2 days)",
			required: false
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "no-dm",
			description: "If we should attempt to dm the banned user with some info",
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
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
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
		const user =  await msg.getUserFromArgs();
		if (user === null) return msg.reply("Th-that wasn't a valid user..");

		const member = await this.getMember(msg.channel.guild.id, user.id);
		if (member !== null) {
			if (member.id === msg.author.id) return msg.reply("I-I can't let you do that..");
			if (member.id === msg.channel.guild.ownerID) return msg.reply("Y-you can't ban the server owner!");
			const compare = msg.member.compareToMember(member);
			if (["higher","same"].includes(compare) && msg.member.id !== msg.channel.guild.ownerID) return msg.reply("Th-that user is higher than, or as high as your highest role.. You cannot ban them");
			const compareMe = msg.channel.guild.me.compareToMember(member);
			if (["higher","same"].includes(compareMe)) return msg.reply("Th-that user is higher than, or as high as my highest role.. I cannot ban them");
		}
		let time = Time.parseTime2(msg.args.slice(-1)[0]), reason: string | null = null;

		if (msg.args.length !== 1) {
			if (time === 0) {
				time = Time.parseTime2(msg.args.join(" "));
				reason = msg.args.slice(1).join(" ");
			} else reason = msg.args.slice(1, -1).join(" ");
			if (time < 1000) time = 0;
		}

		if (time > 1.5768e11) return msg.reply("H-hey! The maximum time is 5 years!");
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");

		let dmError: string | undefined;
		let dm: Eris.Message<Eris.PrivateChannel> | null = null;
		if (!nodm && member !== null && !member.bot)
			dm = await member.user.createMessage(`You were banned from **${msg.channel.guild.name}** by **${msg.author.tag}**\nReason:\n\`\`\`\n${reason ?? "None Provided"}\`\`\`\nTime: **${time === 0 ? "Permanent" : Time.ms(time, true, true, false)}**`)
				.catch((err: Error) => ((dmError = `${err.name}: ${err.message}`, null)));
		await msg.channel.guild.banMember(user.id, delDays, `Ban: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`)
			.then(
				async() => {
					const mdl = await ModLogHandler.createBanEntry(msg.gConfig, user, msg.author, reason, time, delDays);
					if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
					return msg.channel.createMessage(`**${user.tag}** was banned ${time === 0 ? "permanently" : `for \`${Time.ms(time, true, true, false)}\``}, ***${reason ?? "None Provided"}***${dmError !== undefined ? `\n\nFailed to send dm:\n\`${dmError}\`` : ""}${mdl.check !== false ? `\nFor more info, check <#${msg.gConfig.modlog.webhook!.channelId}> (case: **#${mdl.entryId}**)` : ""}`);
				},
				async(err: Error) => {
				// delete the dm if we didn't ban them
					if (dm !== null) await dm.delete().catch(() => null);
					return msg.reply(`I-I failed to ban **${user.tag}**..\n\`${err.name}: ${err.message}\``);
				});
	});
