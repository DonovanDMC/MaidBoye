import Command from "@cmd/Command";

export default new Command("impostor")
	.setPermissions("bot", "embedLinks")
	.setDescription("amogus")
	.setUsage("[@user/text]")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const m = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		return msg.channel.createMessage({
			content: [
				"。　　　　•　    　ﾟ　　。",
				" 　　.　　　.　　　  　　.　　　　　。　　   。　.",
				" 　.　　      。　        ඞ   。　    .    •",
				// eslint-disable-next-line no-irregular-whitespace
				`    •                ${!m ? msg.args.join(" ") : `<@!${m.id}>`} was ${Math.random() > .5 ? "not" : ""} An Impostor.　 。　.`,
				"　 　　。　　 　　　　ﾟ　　　.　    　　　."
			].join("\n"),
			allowedMentions: {
				users: false
			}
		});
	});
