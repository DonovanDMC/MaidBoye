import Command from "@cmd/Command";
import { devLink, kofiLink, supportLink, twitterLink, websiteLink } from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("links", "support", "invite", "inv")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some of my important links")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Invite Info")
					.setDescription(
						`[Support Server](${supportLink})`,
						`[Twitter](${twitterLink})`,
						`[Website](${websiteLink})`,
						`[Developer](${devLink})`,
						`[Ko-Fi (Donate)](${kofiLink})`,
						"[Invite](https://api.maid.gay/links/invite)"
					)
					.toJSON()
			]
		});
	});
