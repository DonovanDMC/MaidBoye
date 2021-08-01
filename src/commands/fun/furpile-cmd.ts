import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
const Redis = db.r;

export default new Command("furpile")
	.setPermissions("bot", "embedLinks")
	.setDescription("Start a furpile, or join one")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to start a furpile on (none to join an existing furpile)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const k = `cmd:multiUser:furpile:${msg.channel.id}`;
		const h = await Redis.smembers(k);

		if (h.length !== 0) {
			if (h.includes(msg.author.id)) return msg.reply("H-hey! You're already in this furpile!");
			await Redis.sadd(k, msg.author.id);
			await Redis.pexpire(k, 18e5);
			return msg.channel.createMessage({
				content: `<@!${msg.author.id}> joined a furpile on ${h.length}!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}furpile\``,
				allowedMentions: {
					users: false
				}
			});
		} else {
			if (msg.args.length === 0) return msg.reply("H-hey! A user is required to start a furpile..");
			const member = await msg.getMemberFromArgs();
			if (member === null) return msg.reply("H-hey! That wasn't a valid member..");
			await Redis.sadd(k, msg.author.id, member.id);
			await Redis.pexpire(k, 18e5);
			await msg.channel.createMessage({
				content: `<@!${msg.author.id}> started a furpile on <@!${member.id}>!\nJoin in with \`${msg.gConfig.getFormattedPrefix()}furpile\``,
				allowedMentions: {
					users: false
				}
			});
		}
	});
