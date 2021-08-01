import Command from "@cmd/Command";
import Eris from "eris";

export default new Command("impostor")
	.setPermissions("bot", "embedLinks")
	.setDescription("amogus")
	.setUsage("[@user/text]")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to sus (none for yourself)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const m = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		return msg.channel.createMessage({
			content: [
				"。　　　　•　    　ﾟ　　。",
				" 　　.　　　.　　　  　　.　　　　　。　　   。　.",
				" 　.　　      。　        ඞ   。　    .    •",
				`    •                ${!m ? msg.args.join(" ") : `<@!${m.id}>`} was ${Math.random() > .5 ? "not" : ""} An Impostor.   。  .`,
				"　 　　。　　 　　　　ﾟ　　　.　    　　　."
			].join("\n"),
			allowedMentions: {
				users: false
			}
		});
	});
