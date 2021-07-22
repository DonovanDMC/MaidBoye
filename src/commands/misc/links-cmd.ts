import Command from "@cmd/Command";
import config from "@config";
import EmbedBuilder from "@util/EmbedBuilder";

export default new Command("links", "support", "invite", "inv")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some of my important links")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Invite Info")
					.setDescription(
						`[Support Server](${config.client.links.supprt})`,
						`[Twitter](${config.client.links.twitter})`,
						`[Website](${config.client.links.website})`,
						`[Developer](${config.client.links.dev})`,
						`[Patreon](${config.client.links.patreon})`,
						"[Invite](https://maid.gay/closed-beta"
					)
					.toJSON()
			]
		});
	});
