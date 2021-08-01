import ModLogHandler from "../../util/handlers/ModLogHandler";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("lock")
	.setPermissions("bot", "embedLinks", "manageChannels")
	.setPermissions("user", "kickMembers")
	.setDescription("keep everyone from speaking in a channel")
	.setUsage("[<channel> [reason]]")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.CHANNEL,
			name: "channel",
			description: "The channel to lock (none for current channel)",
			required: false
		},
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "reason",
			description: "The reason for locking the channel",
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
			if (o.deny & Eris.Constants.Permissions.sendMessages) return msg.reply(`${ch.id === msg.channel.id ? "Th-this" : "Th-that"} channel is already locked!`);
			if (o.allow & Eris.Constants.Permissions.sendMessages) o.allow -= Eris.Constants.Permissions.sendMessages;
		}
		const reason = msg.args.length < 2 ? null : msg.args.slice(1).join(" ");
		if (reason && reason.length > 500) return msg.reply("Th-that reason is too long!");
		await ch.editPermission(msg.channel.guild.id, o?.allow ?? 0n, (o?.deny ?? 0n) | Eris.Constants.Permissions.sendMessages, 0, `Lock: ${msg.author.tag} (${msg.author.id}) -> ${reason ?? "None Provided"}`);
		const mdl = await ModLogHandler.createLockEntry(msg.gConfig, ch, msg.member, reason);
		await msg.reply(`Done.${mdl.check === false ? "" : ` (case #${mdl.entryId})`}`);
		await ch.createMessage({
			embeds: [
				new EmbedBuilder()
					.setTitle("Channel Locked")
					.setDescription(
						`This channel was locked by <@!${msg.author.id}>`,
						`Reason: \`${reason ?? "None Provided"}\``
					)
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setColor("gold")
					.toJSON()
			]
		});
	});
