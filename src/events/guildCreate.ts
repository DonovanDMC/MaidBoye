import { emojis, noIcon } from "../config";
import WebhookStore from "../util/WebhookStore";
import EmbedBuilder from "../util/EmbedBuilder";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("guildCreate", async function(guild) {
	const d = new Date();
	const id = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
	await Redis.incr(`stats:dailyJoins:${id}`);
	let author = {
		name: "Unknown#0000",
		icon_url: noIcon
	};
	let owner = "Unknown#0000 (000000000000000000)";
	if (guild.ownerID) {
		const u = await this.getUser(guild.ownerID).catch(() => null);
		if (u !== null) {
			author = {
				name: `${u.username}#${u.discriminator}`,
				icon_url: u.avatarURL ? u.avatarURL : noIcon
			};
			owner = `${u.username}#${u.discriminator} (${u.id})`;
		}
	}
	Logger.getLogger("Guild Join").info(`New guild joined: ${guild.name} (${guild.id}), owner: ${owner} (${guild.ownerID}), member count: ${guild.memberCount}`);
	await WebhookStore.execute("guilds", {
		embeds: [
			new EmbedBuilder(true)
				.setAuthor(author.name, author.icon_url)
				.setTitle("Guild Joined!")
				.setDescription([
					`Guild #${this.guilds.size + 1}`,
					`Current Total: ${this.guilds.size + 1}`,
					"",
					"**Guild Info**:",
					`${emojis.default.dot} Name: ${guild.name}`,
					`${emojis.default.dot} ID: ${guild.id}`,
					`${emojis.default.dot} **Members**:`,
					`\t${emojis.custom.online}: ${guild.members.filter(m => m.status === "online").length}`,
					`\t${emojis.custom.idle}: ${guild.members.filter(m => m.status === "idle").length}`,
					`\t${emojis.custom.dnd}: ${guild.members.filter(m => m.status === "dnd").length}`,
					`\t${emojis.custom.offline}: ${guild.members.filter(m => m.status === "offline").length}`,
					`\t${emojis.custom.bot}: ${guild.members.filter(m => m.user.bot).length}`,
					`\t${emojis.default.human}: ${guild.members.filter(m => !m.user.bot).length}`,
					`${emojis.default.dot} Large: ${guild.large ? "Yes" : "No"} (${guild.memberCount})`,
					`${emojis.default.dot} Owner: ${owner}`
				])
				.setImage(guild.iconURL ?? noIcon)
				.setThumbnail(author.icon_url)
				.setColor("green")
				.setFooter(`Shard ${guild.shard.id + 1}/${this.shards.size}`)
				.toJSON()
		]
	});
});
