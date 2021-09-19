import { botSauce } from "@config";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import ComponentHelper from "@util/components/ComponentHelper";

export default new Command("avatar")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get someone's avatar..")
	.setUsage("<@user>")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to get the avatar of (none for yourself)",
			required: false
		}
	])
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.USER, "View Avatar")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const user = msg.args.length === 0 ? msg.author : await msg.getUserFromArgs();
		if (user === null) return msg.reply("Th-that isn't a valid user..");

		const c = new ComponentHelper();
		c.addURLButton(user.dynamicAvatarURL(undefined, 4096), false, undefined, "Open Externally");
		if (user.id === this.user.id) c.addURLButton(botSauce, false, undefined, "Open Sauce");
		c.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit.${msg.author.id}`, false, undefined, "Exit");

		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor(msg.author.tag, msg.author.avatarURL)
					.setDescription(user.id === this.user.id ? `If you want to see the full version of my avatar, you can see it [here](${botSauce}).` : "")
					.setTitle(`Avatar of ${user.tag}`)
					.setImage(user.dynamicAvatarURL(undefined, 4096))
					.toJSON()
			],
			components: c.toJSON()
		});
	});
