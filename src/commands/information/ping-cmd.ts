import config from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { performance } from "perf_hooks";
import Eris from "eris";

export default new Command("ping")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get my ping info..")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const m = await msg.channel.createMessage("this will be edited soon");
		const start = performance.now();
		await m.edit("this will be deleted soon");
		const end = performance.now();
		await m.delete();
		return msg.reply({
			embeds: [new EmbedBuilder()
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setTitle("Pong!")
				.setDescription(`\ud83c\udfd3 Gateway: **${msg.channel.guild.shard.latency}ms** | REST: **${(end - start).toFixed(0)}ms**`)
				.setFooter(`UwU | Shard: ${msg.channel.guild.shard.id + 1}/${this.shards.size}`, config.images.bot)
				.toJSON()
			]
		});
	});
