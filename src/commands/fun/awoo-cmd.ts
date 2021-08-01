import Command from "@cmd/Command";
import config from "@config";
import db from "@db";
const Redis = db.r;

// @TODO use components for joining
export default new Command("awoo", "howl")
	.setPermissions("bot", "embedLinks", "useExternalEmojis")
	.setDescription("Start a howl, or join one")
	.setSlashOptions(true, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const k = `cmd:multiUser:awoo:${msg.channel.id}`;
		const h = await Redis.smembers(k);

		if (h.length !== 0) {
			if (h.includes(msg.author.id)) return msg.reply("H-hey! You're already in this howl!");
			await Redis.sadd(k, msg.author.id);
			await Redis.pexpire(k, 18e5);
			return msg.channel.createMessage(`<@!${msg.author.id}> joined a howl with ${h.length}!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}awoo\` ${config.emojis.custom.awoo}${config.emojis.custom.awoo}${config.emojis.custom.awoo}`);
		} else {
			await Redis.sadd(k, msg.author.id);
			await Redis.pexpire(k, 18e5);
			await msg.channel.createMessage(`<@!${msg.author.id}> started a howl!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}awoo\` ${config.emojis.custom.awoo}${config.emojis.custom.awoo}${config.emojis.custom.awoo}`);
		}
	});
