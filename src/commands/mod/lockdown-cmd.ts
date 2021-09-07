import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
const Redis = db.r;

export default new Command("lockdown")
	.setPermissions("bot", "embedLinks", "manageChannels")
	.setPermissions("user", "kickMembers", "manageGuild")
	.setDescription("lock all channels in the server")
	.setUsage("[reason]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for locking the server",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const old = await Redis.get(`lockdown:${msg.channel.guild.id}`);
		if (old) return msg.reply("Th-this server has already been locked down..");
		const channels = msg.channel.guild.channels.filter(c => [Eris.Constants.ChannelTypes.GUILD_TEXT, Eris.Constants.ChannelTypes.GUILD_NEWS].includes(c.type as 0));
		const ovr = [] as Array<[id: string, allow: string, deny: string]>;
		const reason = msg.args.join(" ") || null;
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");
		const m = await msg.reply("Running..");
		for (const ch of channels) {
			const p = ch.permissionOverwrites.get(msg.channel.guild.id) ?? {
				allow: 0n,
				deny: 0n
			};
			// skip if send is already denied
			if (p.deny & Eris.Constants.Permissions.sendMessages) continue;
			else {
				ovr.push([ch.id, p.allow.toString(), p.deny.toString()]);
				if (p.allow & Eris.Constants.Permissions.sendMessages) p.allow -= Eris.Constants.Permissions.sendMessages;
				await ch.editPermission(msg.channel.guild.id, p.allow, p.deny | Eris.Constants.Permissions.sendMessages, Eris.Constants.PermissionOverwriteTypes.ROLE, `Lockdown: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
			}
		}
		if (ovr.length === 0) return m.edit("No channels were locked.");

		await Redis.set(`lockdown:${msg.channel.guild.id}`, JSON.stringify(ovr));
		const mdl = await ModLogHandler.createLockDownEntry(msg.gConfig, msg.member, reason);
		await m.edit(`Locked **${ovr.length}** channels. ${mdl.check === false ? "" : ` (case #${mdl.entryId})`}`);
		if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
	});
