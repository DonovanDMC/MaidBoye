import UserConfig from "@models/User/UserConfig";
import AntiSpam from "@cmd/AntiSpam";
import WebhookStore from "@util/WebhookStore";
import BotFunctions from "@util/BotFunctions";
import GuildConfig from "@models/Guild/GuildConfig";
import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import ExtendedMessage from "@util/ExtendedMessage";
import type { Permissions } from "@util/Constants";
import ErrorHandler from "@handlers/ErrorHandler";
import CommandError from "@cmd/CommandError";
import { Strings, Timers } from "@uwu-codes/utils";
import Eris from "eris";
import StatsHandler from "@handlers/StatsHandler";
import EventsASecondHandler from "@handlers/EventsASecondHandler";
import db from "@db";
import {
	antiSpamMaxVL,
	antiSpamWarnThreshold,
	beta,
	defaultPrefix,
	developers,
	permissionNames,
	supportLink
} from "@config";
const Redis = db.r;

export default new ClientEvent("messageCreate", async function (message) {
	const t = new Timers((developers.includes(message.author.id) || beta) === true ? (label, info) => Logger.getLogger(label).debug(info) : false);
	if (message.author.bot === true || !("type" in message.channel) || message.channel.type === Eris.Constants.ChannelTypes.GROUP_DM) return;

	t.start("userBl");
	const userBl = await UserConfig.prototype.checkBlacklist.call({ id: message.author.id });
	if (userBl.active.length > 0) {
		if (userBl.noticeNotShown.active.length > 0) {
			const bl = userBl.noticeNotShown.active[0];
			await message.reply(`H-hey! You've been blacklisted..\nDeveloper: **${bl.createdByTag}**\nReason: ${bl.reason ?? "None Provided."}\nExpiry: ${bl.expireTime === 0 ? "Never" : BotFunctions.formatDiscordTime(bl.expireTime, "short-datetime", true)}`);
			// we should only show one notice, as to not annoy them too much
			await Promise.all(userBl.noticeNotShown.active.map(async (b) => b.setNoticeShown(true)));
		}
		return;
	}
	t.end("userBl");

	t.start("dm");
	if (message.channel.type === Eris.Constants.ChannelTypes.DM) {
		StatsHandler.trackBulkNoResponse(
			"stats:directMessage",
			`stats:users:${message.author.id}:directMessage`
		);
		Logger.info(`Direct message recieved from ${message.author.tag} (${message.author.id}) | Content: ${message.content || "NONE"}${message.attachments.length !== 0 ? ` | Attachments: ${message.attachments.map((a, i) => `[${i}]: ${a.url}`).join(", ")}` : ""}`);
		return message.channel.createMessage({
			embeds: [
				new EmbedBuilder()
					.setTitle("Hi!")
					.setDescription(`H-hey... I see you direct messaged me.. If you need some help, y-you can join my support server.. <${supportLink}>\nMy default prefix is \`${defaultPrefix.trim()}\`, and you can list my commands b-by using \`${defaultPrefix}help\` in a server.\n\nI-if you don't want this response, run \`${defaultPrefix}toggledmresponse\` in a server..`)
					.setAuthor(message.author.tag, message.author.avatarURL)
					.setFooter(">w<")
					.toJSON()
			]
		});
	}
	t.end("dm");

	// ignore if we can't send messages
	// (we need to check channel and guild to remove Uncached and PrivateChannel)
	if (!("channel" in message) || !("guild" in message.channel) || !message.channel.permissionsOf(this.user.id).has("sendMessages")) return;

	t.start("guildBl");
	const guildBl = await GuildConfig.prototype.checkBlacklist.call({ id: message.guildID });
	if (guildBl.active.length > 0) {
		if (guildBl.noticeNotShown.active.length > 0) {
			const bl = userBl.noticeNotShown.active[0];
			await message.reply(`H-hey! This server has been blacklisted..\nDeveloper: **${bl.createdByTag}**\nReason: ${bl.reason ?? "None Provided."}\nExpiry: ${bl.expireTime === 0 ? "Never" : BotFunctions.formatDiscordTime(bl.expireTime, "short-datetime", true)}`);
			// we should only show one notice, as to not annoy them too much
			await Promise.all(guildBl.noticeNotShown.active.map(async (b) => b.setNoticeShown(true)));
		}
		return;
	}
	t.end("guildBl");
	// not anymore
	// we completely ignore messages inside of threads
	/* if ([
		Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD,
		Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD,
		Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD
	].includes(message.channel.type as 10)) return; */

	t.start("extend");
	const msg = new ExtendedMessage(message as Eris.Message<Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>>, this);
	t.end("extend");
	t.start("process");
	const load = await msg.load();
	t.end("process");
	if (msg.content.toLowerCase().startsWith("maid make")) return msg.reply("Th-that's not my purpose..");
	if (msg.content.toLowerCase() === "maid fuck me") return msg.reply("I-I don't even know you..");
	const { cmd } = msg;
	StatsHandler.trackNoResponse("stats", "message", msg.channel.typeString);

	t.start("leveling");
	const levelingCooldown = await Redis.exists(`leveling:${msg.author.id}:${msg.channel.guild.id}:cooldown`);
	if (!levelingCooldown) {
		await Redis.setex(`leveling:${msg.author.id}:${msg.channel.guild.id}:cooldown`, 60, "");
		const amount = Math.floor(Math.random() * 10) + 5;
		const oldExp = await msg.uConfig.getExp(msg.channel.guild.id);
		const { level: oldLevel } = BotFunctions.calcLevel(oldExp);
		await msg.uConfig.addExp(msg.channel.guild.id, amount);
		const exp = await msg.uConfig.getExp(msg.channel.guild.id);
		const { level } = BotFunctions.calcLevel(exp);
		if (level > oldLevel) {
			const roles = msg.gConfig.levelRoles.filter(l => l.xpRequired <= exp && !msg.member.roles.includes(l.role));
			for (const { role, id } of roles) await msg.member.addRole(role, `Leveling (${oldLevel} -> ${level})`).catch(() =>
				void msg.gConfig.removeLevelRole(id, "id")
			);
			if (msg.gConfig.settings.announceLevelUp) {
				let m: Eris.Message;
				if (msg.channel.permissionsOf(this.user.id).has("sendMessages")) {
					if (msg.channel.permissionsOf(this.user.id).has("embedLinks")) m = await msg.channel.createMessage({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Level Up!")
								.setDescription(`<@!${msg.author.id}> leveled up from **${oldLevel}** to **${level}**!`, roles.length === 0 ? [] : [
									"Roles Gained:",
									...roles.map(r => `- <@&${r.role}>`)
								])
								.toJSON()
						]
					});
					else m = await msg.channel.createMessage({
						content: `Congrats <@!${msg.author.id}> on leveling up from **${oldLevel}** to **${level}**!`,
						allowedMentions: { users: false }
					});
					setTimeout(() => {
						void m.delete().catch(() => null);
					}, 2e4);
				} else void msg.author.createMessage(`You leveled up in **${msg.channel.guild.name}** from **${oldLevel}** to **${level}**\n(I sent this here because I couldn't create messages in the channel you leveled up in)`);
			}
		}

	}

	if (load === false || cmd === null || msg.member === null) return;
	/* const user = await msg.getUserFromArgs();
	const member = await msg.getMemberFromArgs();
	const channel = await msg.getChannelFromArgs();
	const role = await msg.getRoleFromArgs();

	console.log(
		"dashedArgs:", msg.dashedArgs,
		"| args:", msg.args,
		"| rawArgs:", msg.rawArgs,
		"| prefix:", msg.prefix,
		"| cmd:", cmd.triggers[0],
		"\n",
		"getUserFromArgs:", user?.tag ?? null,
		"| getMemberFromArgs:", member?.tag ?? null,
		"| getChannelFromArgs:", channel?.name ?? null,
		"| getRoleFromArgs:", role?.name ?? null
	); */

	// ignore commands in report channels
	if (/^user-report-([a-z\d]+)$/i.exec(msg.channel.name) && !cmd.triggers.includes("report")) return;


	if (!developers.includes(msg.author.id)) {
		t.start("disable");
		if (msg.gConfig.disable.length > 0 && !msg.member.permissions.has("manageGuild")) {
			const server = msg.gConfig.disable.filter(d => d.filterType === "server" && ((d.type === "all" && d.value === null) || ("command" && cmd.triggers[0] === d.value) || (d.type === "category" && cmd.category === d.value)));
			const user = msg.gConfig.disable.filter(d => d.filterType === "user" && msg.author.id === d.filterValue && ((d.type === "all" && d.value === null) || ("command" && cmd.triggers[0] === d.value) || (d.type === "category" && cmd.category === d.value)));
			const role = msg.gConfig.disable.filter(d => d.filterType === "role" && msg.member.roles.includes(d.filterValue) && ((d.type === "all" && d.value === null) || ("command" && cmd.triggers[0] === d.value) || (d.type === "category" && cmd.category === d.value)));
			const channel = msg.gConfig.disable.filter(d => d.filterType === "channel" && msg.channel.id === d.filterValue && ((d.type === "all" && d.value === null) || ("command" && cmd.triggers[0] === d.value) || (d.type === "category" && cmd.category === d.value)));

			if (server.length || user.length || role.length || channel.length) return;
		}
		t.end("disable");

		t.start("antispam");
		AntiSpam.add(msg.author.id, cmd);
		const anti = AntiSpam.get(msg.author.id);
		if ((anti.length % antiSpamWarnThreshold) === 0) {
			const report = BotFunctions.generateReport(msg.author, anti);
			await WebhookStore.execute("antispam", {
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle(`Possible Command Spam | VL: ${anti.length}`)
						.setDescription(`Report URL: ${report.id}\n[Report URL](${report.url})`)
						.toJSON()
				]
			});
			if (anti.length > antiSpamMaxVL) await msg.uConfig.addBlacklist("antispam", this.user.id, "Command Spam", Date.now() + 2.592e+8, report.id);
		}
		t.end("antispam");

		t.start("restrictions");
		if (cmd.restrictions.includes("developer")) {
			StatsHandler.trackBulkNoResponse(
				"stats:restrictionFail:developer",
				`stats:users:${msg.author.id}:restrictionFail:developer`
			);
			return msg.reply("H-hey! You aren't one of my developers!");
		}
		if (cmd.restrictions.includes("nsfw") && !msg.channel.nsfw) {
			StatsHandler.trackBulkNoResponse(
				"stats:restrictionFail:nsfw",
				`stats:users:${msg.author.id}:restrictionFail:nsfw`
			);
			return msg.reply("H-hey! You have to use that in an nsfw channel!");
		}
		if (cmd.restrictions.includes("beta") && !beta) {
			StatsHandler.trackBulkNoResponse(
				"stats:restrictionFail:beta",
				`stats:users:${msg.author.id}:restrictionFail:beta`
			);
			return msg.reply("H-hey! This command can only be used in beta!");
		}
		const optionalUser = [] as Array<Permissions>;
		const missingUser = [] as Array<Permissions>;
		for (const [perm, optional] of cmd.userPermissions) {
			if (!msg.member.permissions.has(perm)) {
				if (optional) optionalUser.push(perm);
				else missingUser.push(perm);
			}
		}

		// I don't really know how to inform users of "optional" permissions right now

		if (missingUser.length > 0) {
			StatsHandler.trackBulkNoResponse(
				...(missingUser.map(p => [
					`stats:missingPermission:user:${p}`,
					`stats:users:${msg.author.id}:missingPermission:user:${p}`
				//                                 typescript™️
				]).reduce((a,b) => a.concat(b), []) as [first: string, ...other: Array<string>])
			);
			return msg.reply(`H-hey! You're missing the ${Strings.plural("permission", missingUser)} **${Strings.joinAnd(missingUser.map(p => permissionNames[p] || p), "**, **")}**.. You must have these to use this command!`);
		}
		// needs to be started either way or end will error
	} else t.start("restrictions");

	// we still check these when developers run commands
	const optionalBot = [] as Array<Permissions>;
	const missingBot = [] as Array<Permissions>;
	for (const [perm, optional] of cmd.botPermissions) {
		if (!msg.channel.guild.me.permissions.has(perm)) {
			if (optional) optionalBot.push(perm);
			else missingBot.push(perm);
		}
	}

	// @FIXME fix Strings#joinAnd boldness
	if (missingBot.length > 0) {
		StatsHandler.trackBulkNoResponse(
			...(missingBot.map(p => [
				`stats:missingPermission:bot:${p}`,
				`stats:users:${msg.author.id}:missingPermission:bot:${p}`
				//                                 typescript™️
			]).reduce((a,b) => a.concat(b), []) as [first: string, ...other: Array<string>])
		);
		return msg.reply(`H-hey! I'm missing the ${Strings.plural("permission", missingBot)} **${Strings.joinAnd(missingBot.map(p => permissionNames[p] || p), "**, **")}**.. I must have these for this command to function!`);
	}
	t.end("restrictions");

	StatsHandler.trackBulkNoResponse(
		`stats:commands:${cmd.triggers[0]}`,
		`stats:users:${msg.author.id}:commands:${cmd.triggers[0]}`
	);
	EventsASecondHandler.add("COMMANDS");
	EventsASecondHandler.add(`COMMANDS.${cmd.triggers[0].toUpperCase()}`);
	Logger.getLogger("CommandHandler").info(`Command ${cmd.triggers[0]} ran with ${msg.args.length === 0 ? "no arguments" : `the arguments "${msg.args.join(" ")}"`} by ${msg.author.tag} (${msg.author.id}) in the guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);

	t.start("run");
	void cmd.run.call(this, msg, cmd)
		.then(res => {
			t.end("run");
			if (res instanceof Error) throw res;
		})
		.catch(async(err: Error) => {
			if (err instanceof CommandError) {
				if (err.message === "INVALID_USAGE") {
					StatsHandler.trackBulkNoResponse(
						`stats:commands:${cmd.triggers[0]}:invalidUsage`,
						`stats:users:${msg.author.id}:commands:${cmd.triggers[0]}:invalidUsage`
					);
					return msg.reply(`H-hey! You didn't use that command right. check \`${msg.gConfig.getFormattedPrefix(0)}help ${cmd.triggers[0]}\` for info on how to use it..`);
				}
				return;
			}

			// ignore errors from eval command
			if (cmd.triggers.includes("eval")) return;

			StatsHandler.trackNoResponse(`stats:commands:${cmd.triggers[0]}:error`);

			const code = await ErrorHandler.handleError(err, msg);

			if (code === null) return msg.reply("S-sorry! There was an error while running that.. Our internal error reporting service didn't return any further info.");
			else return msg.reply(`S-sorry! There was an error while running that.. I-if you want, you can report it to my developers, or try again later..\nCode: \`${code}\`\nSupport: ${supportLink}`);
		}
		);
});
