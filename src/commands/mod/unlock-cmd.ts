import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import Eris from "eris";

export default new Command("unlock")
	.setPermissions("bot", "embedLinks", "manageChannels")
	.setPermissions("user", "kickMembers")
	.setDescription("undo a lock")
	.setUsage("[<channel> [reason]]")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.CHANNEL,
			name: "channel",
			description: "The channel to unlock (none for current channel)",
			required: false
		},
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for unlocking the channel",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const ch = (msg.args.length === 0 ? msg.channel : await msg.getChannelFromArgs()) as Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>;
		if (ch === null) return msg.reply("Th-that wasn't a valid channel..");
		// guild id = @everyone
		const o = ch.permissionOverwrites.get(msg.channel.guild.id);
		if (o) {
			if (o.allow & Eris.Constants.Permissions.sendMessages || !(o.deny & Eris.Constants.Permissions.sendMessages)) return msg.reply("Th-that channel doesn't seem to be locked?");
			if (o.deny & Eris.Constants.Permissions.sendMessages) o.deny -=  Eris.Constants.Permissions.sendMessages;
		}
		const reason = msg.args.length < 2 ? null : msg.args.slice(1).join(" ");
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");
		await ch.editPermission(msg.channel.guild.id, o?.allow ?? 0n, o?.deny ?? 0n, 0, `Unlock: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
		const mdl = await ModLogHandler.createUnLockEntry(msg.gConfig, ch, msg.member, reason);
		if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
		await msg.reply(`Done.${mdl.check === false ? "" : ` (case #${mdl.entryId})`}`);
	});
