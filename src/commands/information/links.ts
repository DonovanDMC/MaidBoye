import Command from "@cmd/Command";
import {
	devLink,
	kofiLink,
	supportLink,
	twitterLink,
	websiteLink
} from "@config";
import ComponentHelper from "@util/components/ComponentHelper";
import Eris from "eris";

export default new Command("links", "support", "invite", "inv")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some of my important links")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			content: "H-here's some links that might interest you!",
			components: new ComponentHelper(3)
				.addURLButton(supportLink, false, undefined, "Support Server")
				.addURLButton(twitterLink, false, undefined, "Twitter")
				.addURLButton(websiteLink, false, undefined, "Website")
				.addURLButton(devLink, false, undefined, "Developer")
				.addURLButton(kofiLink, false, undefined, "Donate")
				.addURLButton("https://api.maid.gay/links/invite", false, undefined, "Invite")
				.toJSON()
		});
	});
