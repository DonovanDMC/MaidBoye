import config from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import fetch from "node-fetch";
import Eris from "eris";

export default new Command("uinfo", "userinfo")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get info about someone..")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to get info about (none for yourself)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		let user = msg.args.length === 0 ? msg.author : await msg.getUserFromArgs();
		// @FIXME banners don't seem to be sent over gateway yet
		if (user && (user.banner === undefined || user.accentColor === undefined)) user = await this.getUser(user.id, true);
		if (user === null) return msg.reply("Th-that isn't a valid user..");
		const member = msg.channel.guild.members.get(user.id);
		const sortedMembers = Array.from(msg.channel.guild.members.values()).sort((a,b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));


		let dRep: { id: string; upvotes: number; downvotes: number; xp: number; rank: string; staff: boolean; } | undefined, infr: { id: string; } & ({ type: "CLEAN";} | { type: "WARN" | "BAN"; reason: string; moderator: string; date: number; }) | undefined;
		try {
			dRep = await fetch(`https://discordrep.com/api/v3/rep/${user.id}`, {
				headers: {
					"User-Agent": config.userAgent,
					"Authorization": config.apiKeys["discord-rep"]
				}
			}).then(v => v.json() as unknown as typeof dRep);
			infr = await fetch(`https://discordrep.com/api/v3/infractions/${user.id}`, {
				headers: {
					"User-Agent": config.userAgent,
					"Authorization": config.apiKeys["discord-rep"]
				}
			}).then(v => v.json() as unknown as typeof infr);
		} catch (e) {
			//
		}

		const badges: Array<keyof typeof config["names"]["badges"]> = BotFunctions.getUserFlagsArray(user);
		if (config.developers.includes(user.id)) badges.push("DEVELOPER");
		if (badges.length === 0) badges.push("NONE");

		const joinPosition = member && (sortedMembers.indexOf(member) + 1);
		const joins = [] as Array<Eris.Member>;
		// I didn't feel like making a function for this, so we do it manually
		if (member && joinPosition) {
			if (joinPosition === 1) joins.push(member, ...sortedMembers.slice(1, 5));
			else if (joinPosition === 2) joins.push(sortedMembers[0], member, ...sortedMembers.slice(2, 5));
			else if (joinPosition === (sortedMembers.length - 1)) joins.push(...sortedMembers.slice(-5, -2), member, sortedMembers[sortedMembers.length - 1]);
			else if (joinPosition === (sortedMembers.length)) joins.push(...sortedMembers.slice(-5, -1), member);
			else joins.push(...sortedMembers.slice(joinPosition - 3, joinPosition - 1), member, ...sortedMembers.slice(joinPosition, joinPosition + 2));
		}

		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setTitle(`User Info for ${user.tag}`)
					.setThumbnail(user.avatarURL)
					.setDescription(
						"**General User**:",
						`${config.emojis.default.dot} Tag: **${user.tag}**`,
						`${config.emojis.default.dot} ID: **${user.id}**`,
						`${config.emojis.default.dot} Avatar: [[Link](${user.avatarURL})]`,
						`${config.emojis.default.dot} Banner: ${user.banner === null ? "[None]" : `[[Link](${user.bannerURL!})] ${user.accentColor === null ? "" : `(#${user.accentColor.toString(16)})`}`}`,
						`${config.emojis.default.dot} Creation Date: ${BotFunctions.formatDiscordTime(user.createdAt, "long-datetime", true)}`,
						member === undefined ? "" : [
							"",
							"**Server Member**:",
							`${config.emojis.default.dot} Join Date: ${member.joinedAt === null ? "Unknown" : BotFunctions.formatDiscordTime(member.joinedAt, "long-datetime", true)}`,
							`${config.emojis.default.dot} Roles: ${member.roles.length === 0 ? "**None**" : member.roles.reduce((a,b) => a + b.length + 4 /* <@&> */, 0) > 1500 ? "**Unable To Display Roles.**" : member.roles.map(r => `<@&${r}>`).join(" ")}`,
							`${config.emojis.default.dot} Join Info:`,
							...joins.map(j => `${config.emojis.default.dot} ${j.id === member.id ? `**#${sortedMembers.indexOf(j) + 1} ${j.tag}**` : `#${sortedMembers.indexOf(j) + 1} ${j.tag}`}`)
						],
						"",
						`[**DiscordRep**](https://discordrep.com/u/${user.id}):`,
						`${config.emojis.default.dot} Rep: ${!dRep? "Unable to fetch data." : `${config.emojis.custom[(dRep.upvotes - dRep.downvotes) > 0 ? "upvote" : (dRep.upvotes - dRep.downvotes) < 0 ? "downvote" : "neutral"]} ${dRep.upvotes - dRep.downvotes}`}`,
						`${config.emojis.default.dot} Infractions: ${!infr ? "Unable to fetch data." : `${infr.type === "CLEAN" ? "None" : `**${infr.type}**, Reason: ${infr.reason}, Timestamp: ${new Date(infr.date).toISOString()}`}`}`,
						"",
						"**Badges**:",
						badges.map(f => `${config.emojis.default.dot} ${config.names.badges[f]}`)
					)
					.setImage(user.bannerURL ?? "")
					.toJSON()
			]
		});
	});
