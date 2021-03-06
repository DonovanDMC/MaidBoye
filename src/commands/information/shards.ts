import { botIcon, emojis } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";


export default new Command("shards")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some info about my shards..")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.addFields(...this.shards.map(s => ({
						name: `Shard #${s.id}`,
						value: [
							`Latency: ${emojis.default[s.latency <= 75 ? "green" : s.latency <= 150 ? "yellow" : s.latency <= 250 ? "orange" : "red"]} ${s.latency}ms`,
							`Guilds: ${this.guilds.filter(g => g.shard.id === s.id).length}`,
							`Status: **${s.status}**`
						].join("\n"),
						inline: true
					})))
					.setFooter(`UwU | Average Latency: ${Math.floor(this.shards.reduce((a,b) => a + b.latency, 0) / this.shards.size)}ms`, botIcon)
					.toJSON()
			]
		});
	});
