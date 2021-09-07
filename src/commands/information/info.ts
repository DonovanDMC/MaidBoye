import { emojis, kofiLink, supportLink, websiteLink } from "@config";
import { dependencies as shrinkDependencies } from "@root/package-lock.json";
import pkg from "@root/package.json";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import CommandHandler from "@cmd/CommandHandler";
import { Strings, Time } from "@uwu-codes/utils";
import Eris from "eris";
import ComponentHelper from "@util/ComponentHelper";
import * as os from "os";

export default new Command("info")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some information about me..")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setDescription(
						"**Stats/General**:",
						`${emojis.default.dot} System Memory: **${Strings.formatBytes(os.totalmem() - os.freemem(), 2)}** / **${Strings.formatBytes(os.totalmem(), 2)}**`,
						`${emojis.default.dot} Process Memory: **${Strings.formatBytes(process.memoryUsage().heapUsed, 2)}** / **${Strings.formatBytes(process.memoryUsage().heapTotal, 2)}**`,
						`${emojis.default.dot} CPU Usage: **${this.cpuUsage}%**`,
						`${emojis.default.dot} Uptime: ${Time.ms(process.uptime() * 1000, true)} (${Time.secondsToHMS(process.uptime())})`,
						`${emojis.default.dot} Shard: **${msg.channel.guild.shard.id + 1}**/**${this.shards.size}**`,
						`${emojis.default.dot} Guilds: **${this.guilds.size}**`,
						`${emojis.default.dot} Large Guilds: **${this.guilds.filter(g => g.large).length}**`,
						`${emojis.default.dot} Channels: **${Object.keys(this.channelGuildMap).length}**`,
						`${emojis.default.dot} Users: **${this.users.size}**`,
						`${emojis.default.dot} Commands: **${CommandHandler.commands.length}** (**${CommandHandler.categories.length}** categories)`,
						"",
						"**Developers**:",
						`${emojis.default.dot} [Creator] [Donovan_DMC](https://donovan.is.gay)`,
						"",
						"**Other**:",
						`${emojis.default.dot} Library: [Eris Custom](https://github.com/DonovanDMC/eris/tree/everything) (**${Eris.VERSION}**, \`${shrinkDependencies.eris.version.split("#")[1].slice(0, 7)}\`)`,
						`${emojis.default.dot} API Version: **v${Eris.Constants.REST_VERSION}**`,
						`${emojis.default.dot} Gateway Version: **v${Eris.Constants.GATEWAY_VERSION}**`,
						`${emojis.default.dot} Version: **${pkg.version}** (Build Date: ${pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`})`,
						`${emojis.default.dot} Node Version: **${process.version}**`,
						`${emojis.default.dot} Typescript Version: **${shrinkDependencies.typescript.version}**`,
						`${emojis.default.dot} Support Server: [${supportLink}](${supportLink})`,
						`${emojis.default.dot} Website: [${websiteLink}](${websiteLink})`,
						`${emojis.default.dot} Donate: [${kofiLink}](${kofiLink})`
					)
					.toJSON()
			],
			components: new ComponentHelper()
				.addURLButton(supportLink, false, undefined, "Support Server")
				.addURLButton(websiteLink, false, undefined, "Website")
				.addURLButton(kofiLink, false, undefined, "Donate")
				.toJSON()
		});
	});
