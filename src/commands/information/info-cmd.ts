import config from "@config";
import { dependencies as shrinkDependencies } from "@root/npm-shrinkwrap.json";
import pkg from "@root/package.json";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import CommandHandler from "@cmd/CommandHandler";
import { Strings, Time } from "@uwu-codes/utils";
import Eris from "eris";
import * as os from "os";

export default new Command("info")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some information about me..")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setDescription(
						"**Stats/General**:",
						`${config.emojis.default.dot} System Memory: **${Strings.formatBytes(os.totalmem() - os.freemem(), 2)}** / **${Strings.formatBytes(os.totalmem(), 2)}**`,
						`${config.emojis.default.dot} Process Memory: **${Strings.formatBytes(process.memoryUsage().heapUsed, 2)}** / **${Strings.formatBytes(process.memoryUsage().heapTotal, 2)}**`,
						`${config.emojis.default.dot} CPU Usage: **${this.cpuUsage}%**`,
						`${config.emojis.default.dot} Uptime: ${Time.ms(process.uptime() * 1000, true)} (${Time.secondsToHMS(process.uptime())})`,
						`${config.emojis.default.dot} Shard: **${msg.channel.guild.shard.id + 1}**/**${this.shards.size}**`,
						`${config.emojis.default.dot} Guilds: **${this.guilds.size}**`,
						`${config.emojis.default.dot} Large Guilds: **${this.guilds.filter(g => g.large).length}**`,
						`${config.emojis.default.dot} Channels: **${Object.keys(this.channelGuildMap).length}**`,
						`${config.emojis.default.dot} Users: **${this.users.size}**`,
						`${config.emojis.default.dot} Commands: **${CommandHandler.commands.length}** (**${CommandHandler.categories.length}** categories)`,
						"",
						"**Developers**:",
						`${config.emojis.default.dot} [Creator] [Donovan_DMC](https://donovan.is.gay)`,
						"",
						"**Other**:",
						`${config.emojis.default.dot} Library: [Eris Custom](https://github.com/DonovanDMC/eris/tree/merge) (**${Eris.VERSION}**, \`${shrinkDependencies.eris.version.split("#")[1].slice(0, 7)}\`)`,
						`${config.emojis.default.dot} API Version: **v${Eris.Constants.REST_VERSION}**`,
						`${config.emojis.default.dot} Gateway Version: **v${Eris.Constants.GATEWAY_VERSION}**`,
						`${config.emojis.default.dot} Version: **${pkg.version}** (Build Date: ${pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`})`,
						`${config.emojis.default.dot} Node Version: **${process.version}**`,
						`${config.emojis.default.dot} Typescript Version: **${shrinkDependencies.typescript.version}**`,
						`${config.emojis.default.dot} Support Server: [${config.client.links.supprt}](${config.client.links.supprt})`
					)
					.toJSON()
			]
		});
	});
