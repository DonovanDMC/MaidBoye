import Command from "@cmd/Command";
import config from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

export default new Command("links", "support", "invite", "inv")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some of my important links")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Invite Info")
					.setDescription(
						`[Support Server](${config.client.links.support})`,
						`[Twitter](${config.client.links.twitter})`,
						`[Website](${config.client.links.website})`,
						`[Developer](${config.client.links.dev})`,
						`[Ko-Fi (Donate)](${config.client.links.kofi})`,
						"[Invite](https://api.maid.gay/links/invite)"
					)
					.toJSON()
			]
		});
	});
