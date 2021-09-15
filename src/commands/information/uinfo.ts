import { apiKeys, developers, emojis, names, userAgent } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import fetch from "node-fetch";
import Eris from "eris";

export default new Command("uinfo", "userinfo")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get info about someone..")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to get info about (none for yourself)",
			required: false
		}
	])
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.USER, "User Info")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		let user = msg.args.length === 0 ? msg.author : await msg.getUserFromArgs();
		// @FIXME banners don't seem to be sent over gateway yet
		if (user && (user.banner === undefined || user.accentColor === undefined)) user = await this.getUser(user.id, true);
		if (user === null) return msg.reply("Th-that isn't a valid user..");
		const member = msg.channel.guild.members.get(user.id)!;

		let dRep: { id: string; upvotes: number; downvotes: number; xp: number; rank: string; staff: boolean; } | undefined, infr: { id: string; } & ({ type: "CLEAN";} | { type: "WARN" | "BAN"; reason: string; moderator: string; date: number; }) | undefined;
		try {
			dRep = await fetch(`https://discordrep.com/api/v3/rep/${user.id}`, {
				headers: {
					"User-Agent": userAgent,
					"Authorization": apiKeys["discord-rep"]
				}
			}).then(v => v.json() as unknown as typeof dRep);
			infr = await fetch(`https://discordrep.com/api/v3/infractions/${user.id}`, {
				headers: {
					"User-Agent": userAgent,
					"Authorization": apiKeys["discord-rep"]
				}
			}).then(v => v.json() as unknown as typeof infr);
		} catch {
			//
		}

		const badges: Array<keyof typeof names["badges"]> = BotFunctions.getUserFlagsArray(user);
		if (developers.includes(user.id)) badges.push("DEVELOPER");
		if (badges.length === 0) badges.push("NONE");

		// this is legacy code but more importantly, IT WORKS
		//                                                              I don't know where joined_at would be null
		const m = Array.from(msg.channel.guild.members.values()).sort((a, b) => a.joinedAt! - b.joinedAt!).map(v => v.id);
		// eslint-disable-next-line no-inner-declarations
		function workItOut(n: boolean, amount = 2) {
			amount++;
			const k: Array<string> = [];
			for (let i = 1; i < amount; i++) {
				const d = n ? m.indexOf(user!.id) - i : m.indexOf(user!.id) + i;
				if (d < 0 || d > (m.length - 1)) continue;
				else k.push(m[d]);
			}
			return k;
		}

		let one = workItOut(true).reverse();
		let two = workItOut(false);
		if (one.length === 0) two = workItOut(false, 4);
		else if (one.length === 1) two = workItOut(false, 3);
		else if (two.length === 0) one = workItOut(false, 4);
		else if (two.length === 1) one = workItOut(false, 3);
		const around = [...one, user.id, ...two];

		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setTitle(`User Info for ${user.tag}`)
					.setThumbnail(user.avatarURL)
					.setDescription(
						"**General User**:",
						`${emojis.default.dot} Tag: **${user.tag}**`,
						`${emojis.default.dot} ID: **${user.id}**`,
						`${emojis.default.dot} Avatar: [[Link](${user.avatarURL})]`,
						`${emojis.default.dot} Banner: ${user.banner === null ? "[None]" : `[[Link](${user.bannerURL!})] ${!user.accentColor ? "" : `(#${user.accentColor.toString(16)})`}`}`,
						`${emojis.default.dot} Creation Date: ${BotFunctions.formatDiscordTime(user.createdAt, "long-datetime", true)}`,
						member === undefined ? "" : [
							"",
							"**Server Member**:",
							`${emojis.default.dot} Join Date: ${member.joinedAt === null ? "Unknown" : BotFunctions.formatDiscordTime(member.joinedAt, "long-datetime", true)}`,
							`${emojis.default.dot} Roles: ${member.roles.length === 0 ? "**None**" : member.roles.reduce((a,b) => a + b.length + 4 /* <@&> */, 0) > 1500 ? "**Unable To Display Roles.**" : member.roles.map(r => `<@&${r}>`).join(" ")}`,
							`${emojis.default.dot} Join Info:`,
							...around.map(a => `${a === user!.id ? `- **[#${m.indexOf(a) + 1}]**` : `- [#${m.indexOf(a) + 1}]`} <@!${a}> (${BotFunctions.formatDiscordTime(msg.channel.guild.members.get(a)!.joinedAt!, "short-datetime", true)})`)
						],
						"",
						`[**DiscordRep**](https://discordrep.com/u/${user.id}):`,
						`${emojis.default.dot} Rep: ${!dRep ? "Unable to fetch data." : `${emojis.custom[(dRep.upvotes - dRep.downvotes) > 0 ? "upvote" : (dRep.upvotes - dRep.downvotes) < 0 ? "downvote" : "neutral"]} ${dRep.upvotes - dRep.downvotes}`}`,
						`${emojis.default.dot} Infractions: ${!infr ? "Unable to fetch data." : `${infr.type === "CLEAN" ? "None" : `**${infr.type}**, Reason: ${infr.reason}, Timestamp: ${new Date(infr.date).toISOString()}`}`}`,
						"",
						"**Badges**:",
						badges.map(f => `${emojis.default.dot} ${names.badges[f]}`)
					)
					.setImage(user.bannerURL ?? "")
					.toJSON()
			]
		});
	});
