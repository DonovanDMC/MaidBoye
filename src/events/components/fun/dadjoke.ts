import ComponentInteractionHandler from "../main";
import EmbedBuilder from "@util/EmbedBuilder";
import fetch from "node-fetch";
import { userAgent } from "@config";

ComponentInteractionHandler
	.registerHandler("dadjoke-new", false, async function handler(interaction) {
		await interaction.acknowledge();
		const { joke } = await fetch("https://icanhazdadjoke.com", {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"User-Agent": userAgent
			}
		}).then(v => v.json() as Promise<{ joke: string; }>);

		// sauce: https://e926.net/posts/1535420
		return interaction.editOriginalMessage({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setDescription(joke)
					.setThumbnail("https://assets.maid.gay/dadjoke.png")
					.setColor("gold")
					.toJSON()
			]
		});
	});
