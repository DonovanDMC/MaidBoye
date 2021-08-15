import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
const Redis = db.r;

export default new Command("unlockdown")
	.setPermissions("bot", "embedLinks", "manageChannels")
	.setPermissions("user", "kickMembers", "manageGuild")
	.setDescription("unlock all channels in the server")
	.setUsage("[reason]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for unlocking the server",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const info = await Redis.get(`lockdown:${msg.channel.guild.id}`);
		if (info === null) return msg.reply("Th-this server isn't locked down..");
		const channels = msg.channel.guild.channels.filter(c => [Eris.Constants.ChannelTypes.GUILD_TEXT, Eris.Constants.ChannelTypes.GUILD_NEWS].includes(c.type as 0));
		let pInfo: Array<[id: string, allow: string, deny: string]>;
		try {
			pInfo = JSON.parse(info);
		} catch {
			await Redis.del(`lockdown:${msg.channel.guild.id}`);
			return msg.reply("Th-there was an error parsing the lockdown info..");
		}
		const reason = msg.args.join(" ") || null;
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");
		const m = await msg.reply("Running..");
		let i = 0;
		for (const ch of channels) {
			const o = pInfo.find(([v]) => v === ch.id);
			const p = ch.permissionOverwrites.get(msg.channel.guild.id);
			if (!o || !p) continue;
			i++;
			if (p.allow & Eris.Constants.Permissions.sendMessages) p.allow -= Eris.Constants.Permissions.sendMessages;
			await ch.editPermission(msg.channel.guild.id, BigInt(o[1]), BigInt(o[2]), 0, `Unlockdown: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
		}

		await Redis.del(`lockdown:${msg.channel.guild.id}`);
		const mdl = await ModLogHandler.createUnLockDownEntry(msg.gConfig, msg.member, reason);
		if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
		await m.edit(`Unlocked **${i}** channel${i !== 1 ? "s" : ""}. ${mdl.check === false ? "" : ` (case #${mdl.entryId})`}`);

	});
