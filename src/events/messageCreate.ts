import ClientEvent from "../util/ClientEvent";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";
import ExtendedMessage from "../util/ExtendedMessage";
import { Permissions } from "../util/cmd/Command";
import ErrorHandler from "../util/ErrorHandler";
import CommandError from "../util/cmd/CommandError";
import config from "@config";
import { Strings } from "@uwu-codes/utils";
import Eris from "eris";
import StatsHandler from "@util/handlers/StatsHandler";
import EventsASecondHandler from "@util/handlers/EventsASecondHandler";

export default new ClientEvent("messageCreate", async function (message) {
	if (message.author.bot === true || !("type" in message.channel) || message.channel.type === Eris.Constants.ChannelTypes.GROUP_DM) return;
	// @TODO blacklist

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
					.setDescription(`H-hey... I see you direct messaged me.. If you need some help, y-you can join my support server.. <${config.client.links.supprt}>\nMy default prefix is \`${config.defaults.prefix.trim()}\`, and you can list my commands b-by using \`${config.defaults.prefix}help\` in a server.\n\nI-if you don't want this response, run \`${config.defaults.prefix}toggledmresponse\` in a server..`)
					.setAuthor(message.author.tag, message.author.avatarURL)
					.setFooter(">w<")
					.toJSON()
			]
		});
	}

	// ignore if we can't send messages
	// (we need to check channel and guild to remove Uncached and PrivateChannel)
	if ("channel" in message && "guild" in message.channel && !message.channel.permissionsOf(this.user.id).has("sendMessages")) return;

	// we completely ignore messages inside of threads
	if ([
		Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD,
		Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD,
		Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD
	].includes(message.channel.type as 10)) return;

	const msg = new ExtendedMessage(message as Eris.Message<Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>>, this);
	const load = await msg.load();
	const { cmd } = msg;
	StatsHandler.trackNoResponse("stats", "message", msg.channel.typeString);
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

	if (!config.developers.includes(msg.author.id)) {
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
		if (cmd.restrictions.includes("beta") && !config.beta) {
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
			return msg.reply(`H-hey! You're missing the ${Strings.plural("permission", missingUser)} **${Strings.joinAnd(missingUser.map(p => config.permissions[p] || p), "**, **")}**.. You must have these to use this command!`);
		}
	}

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
		return msg.reply(`H-hey! I'm missing the ${Strings.plural("permission", missingBot)} **${Strings.joinAnd(missingBot.map(p => config.permissions[p] || p), "**, **")}**.. I must have these for this command to function!`);
	}

	StatsHandler.trackBulkNoResponse(
		`stats:commands:${cmd.triggers[0]}`,
		`stats:users:${msg.author.id}:commands:${cmd.triggers[0]}`
	);
	EventsASecondHandler.add("COMMANDS");
	EventsASecondHandler.add(`COMMANDS.${cmd.triggers[0].toUpperCase()}`);
	Logger.getLogger("CommandHandler").info(`Command ${cmd.triggers[0]} ran with ${msg.args.length === 0 ? "no arguments" : `the arguments "${msg.rawArgs.join(" ")}" by ${msg.author.tag} (${msg.author.id}) in the guild ${msg.channel.guild.name} (${msg.channel.guild.id})`}`);

	void cmd.run.call(this, msg, cmd)
		.then(res => {
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

			StatsHandler.trackNoResponse(`stats:commands:${cmd.triggers[0]}:error`);

			const code = await ErrorHandler.handleError(err, msg);

			if (code === null) return msg.reply("S-sorry! There was an error while running that.. Our internal error reporting service didn't return any further info.");
			else return msg.reply(`S-sorry! There was an error while running that.. I-if you want, you can report it to my developers, or try again later..\nCode: \`${code}\`\nSupport: ${config.client.links.supprt}`);
		});
});
