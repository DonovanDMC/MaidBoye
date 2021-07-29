import Command from "@cmd/Command";
import config from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import fetch from "node-fetch";

export default new Command("dadjoke", "joke")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get a dadjoke")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const { joke } = await fetch("https://icanhazdadjoke.com", {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"User-Agent": config.userAgent
			},
			timeout: 5e3
		}).then(v => v.json() as Promise<{ joke: string; }>);

		// sauce: https://e926.net/posts/1535420
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setDescription(joke)
					.setThumbnail("https://assets.maid.gay/dadjoke.png")
					.setColor("gold")
					.toJSON()
			]
		});
	});
