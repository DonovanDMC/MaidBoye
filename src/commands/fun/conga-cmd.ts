import Command from "@cmd/Command";
import config from "@config";
import db from "@db";
const Redis = db.r;

export default new Command("conga")
	.setPermissions("bot", "embedLinks", "useExternalEmojis")
	.setDescription("Start a conga, or join one")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const k = `cmd:multiUser:conga:${msg.channel.id}`;
		const h = await Redis.smembers(k);

		if (h.length !== 0) {
			if (h.includes(msg.author.id)) return msg.reply("H-hey! You're already in this conga!");
			await Redis.sadd(k, msg.author.id);
			await Redis.pexpire(k, 18e5);
			return msg.channel.createMessage({
				content: `<@!${msg.author.id}> joined a conga with ${h.length}!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}conga\` ${config.emojis.custom.furdancing}${config.emojis.custom.furdancing}${config.emojis.custom.furdancing}`,
				allowedMentions: {
					users: false
				}
			});
		} else {
			if (msg.args.length === 0) return msg.reply("H-hey! A user is required to start a conga..");
			const member = await msg.getMemberFromArgs();
			if (member === null) return msg.reply("H-hey! That wasn't a valid member..");
			await Redis.sadd(k, msg.author.id, member.id);
			await Redis.pexpire(k, 18e5);
			await msg.channel.createMessage({
				content: `<@!${msg.author.id}> started a conga with <@!${member.id}>!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}conga\` ${config.emojis.custom.furdancing}${config.emojis.custom.furdancing}${config.emojis.custom.furdancing}`,
				allowedMentions: {
					users: false
				}
			});
		}
	});
