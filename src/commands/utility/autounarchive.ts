import Command from "@cmd/Command";
import { emojis } from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("autounarchive", "autounarch")
	.setPermissions("bot", "embedLinks", "manageChannels", "manageThreads")
	.setPermissions("user", "manageChannels")
	.setDescription("Clean up some messages")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "add",
			description: "Add a thread to be automatically unarchived.",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
					name: "channel",
					description: "The thread to automatically unarchive.",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "remove",
			description: "Remove a thread from being automatically unarchived.",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
					name: "entry",
					description: "The thread number, see the list command.",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "list",
			description: "List the currently auto unarchived threads."
		}
	])
	.setUsage(async function(msg) {
		return {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Command Help")
					.setDescription(
						`Add: \`${msg.gConfig.getFormattedPrefix()}autounarchive add <#thread>\``,
						`Remove: \`${msg.gConfig.getFormattedPrefix()}autounarchive remove <entry>\` (see list)`,
						`List: \`${msg.gConfig.getFormattedPrefix()}autounarchive list\``,
						"",
						"(\"threads\" refers to added threads, not any)",
						"Notes:",
						`${emojis.default.dot} Threads will not be unarchived if they are archived by a moderator.`,
						`${emojis.default.dot} Threads will be unarchived if they are archived by a normal user`,
						`${emojis.default.dot} Threads will be automatically removed from the list if they are deleted, or a moderator archives them.`
					)
					.toJSON()
			]
		};
	})
	.setCooldown(5e3)
	.setExecutor(async function(msg) {
		switch (msg.args[0]?.toLowerCase()) {
			case "add": {
				if (msg.gConfig.autoUnarchive.length >= 5) return msg.reply("H-hey! You already have the maximum amount added.. Remove some to add more.");
				if (msg.args.length === 1) return msg.reply("H-hey! You have to specify a thread to add..");
				const ch = await msg.getChannelFromArgs<Eris.AnyThreadChannel>(1, 0, true, undefined, true);
				if (ch === null) return msg.reply("H-hey! That wasn't a valid channel..");
				if (![Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD, Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD, Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD].includes(ch.type)) return msg.reply("H-hey! That channel isn't a thread..");
				if (ch.threadMetadata.locked) return msg.reply("H-hey! That thread is locked.. Please unlock it and try again.");
				if (ch.threadMetadata.autoArchiveDuration < 1440) await ch.edit({ autoArchiveDuration: 1440 });
				if (ch.threadMetadata.archived) await ch.edit({ archived: false });
				await msg.gConfig.addAutoUnarchiveEntry(ch.id);
				return msg.reply(`Successfully added <#${ch.id}> to the auto unarchive list.`);
				break;
			}

			case "remove": {
				if (msg.gConfig.autoUnarchive.length === 0) return msg.reply("There are not any entries to remove.");
				const pos = Number(msg.args[1]);
				const id = msg.gConfig.autoUnarchive[pos].threadId;
				if (isNaN(pos) || pos < 1 || pos > 5 || msg.gConfig.autoUnarchive.length < pos) return msg.reply("H-hey! You need to specify a valid entry to remove..");
				const d = await msg.gConfig.removeAutoUnarchiveEntry(id);
				return msg.reply(d ? `Successfully removed <#${id}>.` : `Failed to remove <#${id}>`);
				break;
			}

			case "list": {
				if (msg.gConfig.autoUnarchive.length === 0) return msg.reply("There are not any entries to list.");
				return msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("Automatically Unarchived Threads")
							.setDescription(msg.gConfig.autoUnarchive.map((t, i) => `${i + 1}.) <#${t.threadId}>`))
							.toJSON()
					]
				});
				break;
			}

			default: return msg.reply(`H-hey! You have to provide some arguments, silly.. See \`${msg.gConfig.getFormattedPrefix()}help autounarchive\` for help`);
		}
	});
