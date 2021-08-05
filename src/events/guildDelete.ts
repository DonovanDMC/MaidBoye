import config from "../config";
import WebhookStore from "../util/WebhookStore";
import EmbedBuilder from "../util/EmbedBuilder";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("guildDelete", async function(guild) {
	const d = new Date();
	const id = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
	await Redis.decr(`stats:dailyJoins:${id}`);
	if (!("name" in guild)) {
		Logger.getLogger("Guild Leave").info(`Left uncached guild "${guild.id}". We now have ${this.guilds.size} guilds!`);
		return;
	}
	let author = {
		name: "Unknown#0000",
		icon_url: config.images.noIcon
	};
	let owner = "Unknown#0000 (000000000000000000)";
	if (guild.ownerID) {
		const u = await this.getUser(guild.ownerID).catch(() => null);
		if (u !== null) {
			author = {
				name: `${u.username}#${u.discriminator}`,
				icon_url: u.avatarURL ? u.avatarURL : config.images.noIcon
			};
			owner = `${u.username}#${u.discriminator} (${u.id})`;
		}
	}
	Logger.getLogger("GuildCreare").info(`New guild joined: ${guild.name} (${guild.id}), owner: ${owner} (${guild.ownerID}), member count: ${guild.memberCount}`);
	await WebhookStore.execute("guilds", {
		embeds: [
			new EmbedBuilder(true)
				.setAuthor(author.name, author.icon_url)
				.setTitle("Guild Left")
				.setDescription([
					`Guild #${this.guilds.size + 1}`,
					`Current Total: ${this.guilds.size}`,
					"",
					"**Guild Info**:",
					`${config.emojis.default.dot} Name: ${guild.name}`,
					`${config.emojis.default.dot} ID: ${guild.id}`,
					`${config.emojis.default.dot} **Members**:`,
					`\t${config.emojis.custom.online}: ${guild.members.filter(m => m.status === "online").length}`,
					`\t${config.emojis.custom.idle}: ${guild.members.filter(m => m.status === "idle").length}`,
					`\t${config.emojis.custom.dnd}: ${guild.members.filter(m => m.status === "dnd").length}`,
					`\t${config.emojis.custom.offline}: ${guild.members.filter(m => m.status === "offline").length}`,
					`\t${config.emojis.custom.bot}: ${guild.members.filter(m => m.user.bot).length}`,
					`\t${config.emojis.default.human}: ${guild.members.filter(m => !m.user.bot).length}`,
					`${config.emojis.default.dot} Large: ${guild.large ? "Yes" : "No"} (${guild.memberCount})`,
					`${config.emojis.default.dot} Owner: ${owner}`
				])
				.setImage(guild.iconURL ?? config.images.noIcon)
				.setThumbnail(author.icon_url)
				.setColor("red")
				.setFooter(`Shard ${guild.shard.id + 1}/${this.shards.size}`)
				.toJSON()
		]
	});
});
