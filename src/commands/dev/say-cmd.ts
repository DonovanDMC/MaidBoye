import Command from "@cmd/Command";

export default new Command("say")
	.setRestrictions("developer")
	.setDescription("M-make me say something..")
	.setUsage("<text>")
	.setParsedFlags("d", "delete", "reply", "mention", "sticker")
	.setExecutor(async function(msg) {
		if (msg.dashedArgs.value.includes("d") || msg.dashedArgs.value.includes("delete")) await msg.delete();
		return msg.channel.createMessage({
			content: msg.args.join(" "),
			messageReference: msg.dashedArgs.keyValue.reply === undefined || !/\d{15,21}/.exec(msg.dashedArgs.keyValue.reply) ? undefined : {
				messageID: msg.dashedArgs.keyValue.reply,
				channelID: msg.channel.id,
				guildID: msg.channel.guild.id
			},
			allowedMentions: {
				repliedUser: !!msg.dashedArgs.keyValue.reply && msg.dashedArgs.value.includes("mention")
			},
			stickerIDs: msg.dashedArgs.keyValue.sticker ? [msg.dashedArgs.keyValue.sticker] : []
		});
	});
