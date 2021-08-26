import { emojis, permissionNames } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import MessageCollector from "@util/MessageCollector";
import { Strings } from "@uwu-codes/utils";
import Eris from "eris";
import chunk from "chunk";

export default new Command("clean", "clear", "prune", "purge")
	.setPermissions("bot", "embedLinks", "manageMessages")
	.setPermissions("user", "manageMessages")
	.setDescription("Clean up some messages")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "all",
			description: "Clean up all types of messages",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "user",
			description: "Clean up all messages from a specific user",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.USER,
					name: "user",
					description: "The user to clean up messages from",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "bots",
			description: "Clean up messages from any bots",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "channel",
			description: "Clean up messages in a channel",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
					name: "channel",
					description: "The channel to clean up messages in",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "role",
			description: "Clean up messages from members that have a role",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.ROLE,
					name: "role",
					description: "The role to delete messages from",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "commands",
			description: "Clean up command messages for me",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "text",
			description: "Clean up messages containing a specific string",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "string",
					description: "The string to match to message content",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "amount",
					description: "Amount of messages to delete, between 2 and 1000",
					required: true
				}
			]
		}
	])
	.setUsage(async function (msg, cmd) {
		return {
			embeds: [
				new EmbedBuilder()
					.setTitle("Command Help")
					.setColor("green")
					.setDescription([
						`Description: ${cmd.description || "None"}`,
						`Restrictions: ${cmd.restrictions.length === 0 ? "None" : ""}`,
						...(cmd.restrictions.length === 0 ? [] : cmd.restrictions.map(r => `- **${Strings.ucwords(r)}**`)),
						"Usage:",
						`${emojis.default.dot} All: \`${msg.gConfig.getFormattedPrefix()}clean 20\` (2-1000)`,
						`${emojis.default.dot} Specific User: \`${msg.gConfig.getFormattedPrefix()}clean @user 20\``,
						`${emojis.default.dot} All Bots: \`${msg.gConfig.getFormattedPrefix()}clean bots 20\``,
						`${emojis.default.dot} Different Channel: \`${msg.gConfig.getFormattedPrefix()}clean #channel 20\``,
						`${emojis.default.dot} Role: \`${msg.gConfig.getFormattedPrefix()}clean @role 20\``,
						`${emojis.default.dot} My Commands: \`${msg.gConfig.getFormattedPrefix()}clean commands 20\``,
						`${emojis.default.dot} Text: \`${msg.gConfig.getFormattedPrefix()}clean text 20 "something here"\``,
						"",
						`User Permissions: ${cmd.userPermissions.length === 0 ? "None" : ""}`,
						...(cmd.userPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.userPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"]),
						`Bot Permissions: ${cmd.botPermissions.length === 0 ? "None" : ""}`,
						...(cmd.botPermissions.length === 0 ? [] : ["```diff\n--- (red = optional)", ...cmd.botPermissions.map(([perm, optional]) => `${optional ? "-" : "+"} ${permissionNames[perm]}`), "\n```"])
					].join("\n"))
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.toJSON()
			]
		};
	})
	.setCooldown(5e3)
	.setExecutor(async function(msg) {
		if (msg.args.length === 0) return msg.reply(`H-hey! You have to provide some arguments, silly.. See \`${msg.gConfig.getFormattedPrefix()}clean help\` for help`);
		// assume they provided the arguments backwards
		if (msg.args.length > 1 && (!isNaN(Number(msg.args[0])) && isNaN(Number(msg.args[1])))) msg.args = [
			msg.args[1],
			msg.args[0],
			...msg.args.slice(2)
		];
		const amount = Number(msg.args.length === 1 ? msg.args[0] : msg.args[1]);
		if (amount < 2) return msg.reply("H-hey! You have to provide a number 2 or higher!");
		if (amount > 1000) return msg.reply("H-hey! You have to provide a number 1000 or lower!");
		if (isNaN(amount)) return msg.reply("H-hey! You have to provide a number for the amount!");
		let type: "all" | "user" | "bots" | "channel" | "role" | "commands" | "text", target: null | Eris.User | Eris.GuildTextableChannel | Eris.Role | string;
		// all messages
		if (msg.args.length === 1) {
			type = "all";
			target = null;
		} else {
			switch (msg.args[1]?.toLowerCase()) {
				// bot messages
				case "bot":
				case "bots": {
					type = "bots";
					target = null;
					break;
				}

				// command messages
				case "commands": {
					type = "commands";
					target = null;
					break;
				}

				// text filtered messages
				case "text": {
					type = "text";
					target = msg.args.slice(2).join(" ");
					if (!target) return msg.reply("H-hey! You have to supply some text to look for..");
					break;
				}

				// specific
				default: {
					const user = await msg.getUserFromArgs(1, 0);
					const role = await msg.getRoleFromArgs(1, 0);
					const channel = await msg.getChannelFromArgs<Eris.GuildTextableChannel>(0, 0, undefined, undefined, true);

					if (user !== null) {
						type = "user";
						target = user;
					} else if (role !== null) {
						type = "role";
						target = role;
					} else if (channel !== null) {
						type = "channel";
						target = channel;
						if (![Eris.Constants.ChannelTypes.GUILD_TEXT, Eris.Constants.ChannelTypes.GUILD_NEWS].includes(channel.type as 0)) {
							if ([Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD, Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD, Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD].includes(channel.type as 10)) return msg.reply("H-hey! Sorry! This command doesn't support threads..");
							else return msg.reply("H-hey! Please provide a text channel..");
						}

						if (!channel.permissionsOf(this.user.id).has("manageMessages")) return msg.reply(`H-hey! I don't have the **Manage Messages** permission in <#${channel.id}>..`);
					} else return msg.reply("I-I couldn't figure out what you were trying to clean up.. try again?");
				}
			}
		}
		console.log(amount, type, target?.toString());
		const ch = type === "channel" ? target as Eris.GuildTextableChannel : msg.channel;
		await msg.channel.sendTyping();
		const typing = setInterval(() => msg.channel.sendTyping(), 7e3);
		const time = setTimeout(() => {
			clearInterval(typing);
		}, 7.5e4);

		async function getMessages(left = amount, old?: Array<Eris.Message<Eris.GuildTextableChannel>>): Promise<Array<Eris.Message<Eris.GuildTextableChannel>>> {
			const m = await ch.getMessages({
				limit: left > 100 ? 100 : left,
				before: old ? old[old.length - 1].id : undefined
			}) as Array<Eris.Message<Eris.GuildTextableChannel>>;
			left -= 100;
			if (left > 0) return getMessages(left, [...(old ?? []), ...m]);
			else return [...(old ?? []), ...m];
		}

		//                                 fetch extra for filtering
		const messages = await getMessages(amount < 100 ? 100 : amount);
		let filteredDate = 0;
		const filtered = messages.filter(m => {
			if (m.createdAt < (Date.now() - 1.21e+9)) {
				filteredDate++;
				return false;
			} else {
			// let type: "all" | "user" | "bots" | "channel" | "role" | "commands" | "text", target: null | Eris.User | Eris.GuildTextableChannel | Eris.Role | string;
				switch (type) {
					case "user": return m.author.id === (target as Eris.User).id;
					case "bots": return m.author.bot;
					case "role": return m.member && m.member.roles.includes((target as Eris.Role).id);
					case "commands": return msg.gConfig.prefix.some(p => m.content.toLowerCase().startsWith(p.value));
					case "text": return m.content.toLowerCase().indexOf((target as string).toLowerCase()) !== -1;
					default: return true;
				}
			}
		});

		const count = await msg.reply(`Total Messages Recieved: **${messages.length}**\nOlder Than 2 Weeks: **${filteredDate}**\nFiltered Out: **${((messages.length - filteredDate) - filtered.length)}**\n\nMessages Left Over: **${filtered.length}**\n Excess Removed: **${filtered.length > amount ? filtered.length - amount : 0}**`);
		if (filtered.length < 2) {
			clearInterval(typing);
			clearTimeout(time);
			return msg.reply("There weren't any messages left over after filtering..");
		}

		clearInterval(typing);
		clearTimeout(time);
		const sendCancel = await msg.channel.createMessage("Send \"cancel\" within 5 seconds to cancel message deletion..");
		const waitCancel = await MessageCollector.awaitMessages(msg.channel.id, 5e3, (m) => m.author.id === msg.author.id);
		if (waitCancel !== null && waitCancel.content.toLowerCase() === "cancel") {
			await count.delete();
			await sendCancel.delete();
			await waitCancel.delete().catch(() => null);
			return msg.reply("Cancelled.");
		}
		await sendCancel.edit("Running...");
		if (filtered.length > amount) filtered.forEach((f, i) =>
			i > (amount + 1) ? filtered.splice(i, 1) : null
		);

		const typing2 = setInterval(() => msg.channel.sendTyping(), 7e3);
		const time2 = setTimeout(() => {
			clearInterval(typing);
		}, 6e4);
		await Promise.all(chunk(filtered, 100).map(async(m) => ch.deleteMessages(m.map(v => v.id))));


		clearInterval(typing2);
		clearTimeout(time2);
		return sendCancel.edit(`Successfully cleaned up **${filtered.length}** messages. **${filteredDate}** were removed due to them being over 2 weeks old.`);
	});
