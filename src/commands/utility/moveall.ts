import Command from "@cmd/Command";
import Eris from "eris";

export default new Command("moveall")
	.setPermissions("bot", "voiceMoveMembers")
	.setPermissions("user", "voiceMoveMembers")
	.setDescription("move all voice members from one channel to another")
	.setUsage("<from> <to>")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
			name: "from",
			description: "The channel to move people from",
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.CHANNEL,
			name: "to",
			description: "The channel to move people to",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 2) return msg.reply("H-hey! You have to provide both a from and to.");

		const from = await msg.getChannelFromArgs<Eris.VoiceChannel>(0, 0, true, Eris.Constants.ChannelTypes.GUILD_VOICE);
		const to = await msg.getChannelFromArgs<Eris.VoiceChannel>(1, 1, true, Eris.Constants.ChannelTypes.GUILD_VOICE);

		if (from === null || to === null) return msg.reply("H-hey! One or both of the channels you provided was invalid..");

		if ([from.type, to.type].some(v => ![Eris.Constants.ChannelTypes.GUILD_VOICE, Eris.Constants.ChannelTypes.GUILD_STAGE].includes(v))) return msg.reply("You must provide two **voice** channels.");
		const perms: Array<keyof typeof Eris["Constants"]["Permissions"]> = [
				"voiceConnect",
				"voiceMoveMembers"
			],
			a = to.permissionsOf(msg.author.id),
			b = to.permissionsOf(this.user.id),
			// cloning the value
			o = Number(from.voiceMembers.size);

		for (const p of perms) {
			if (!a.has(p)) return msg.reply(`You must have access to join the channel you're moving people to. You're missing **${p}**.`);
			if (!b.has(p)) return msg.reply(`I do not have access to the channel you wanted to move people to. I'm missing **${p}**.`);
		}

		await Promise.all(from.voiceMembers.map(async (m) => m.edit({
			channelID: to.id
		})));

		return msg.reply(`Moved **${o}** users from <#${from.id}> to <${to.id}>`);
	});
