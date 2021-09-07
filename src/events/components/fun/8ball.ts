import ComponentInteractionHandler from "../main";
import { answers } from "../../../commands/fun/8ball-cmd";
import EmbedBuilder from "@util/EmbedBuilder";

ComponentInteractionHandler
	.registerHandler("8ball-new", false, async function handler(interaction) {
		const image = answers[Math.floor(Math.random() * answers.length)];
		const [, q = "UNKNOWN"] = /```\n(.*)```/.exec(interaction.message.embeds[0].description ?? "") ?? [];
		await interaction.editParent({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle("8ball Question")
					.setDescription(`You Asked:\n\`\`\`\n${q}\`\`\`\nThe Magic 8Ball's Answer:`)
					.setImage(image)
					.setFooter("Disclaimer: Do not take any answers seriously!")
					.toJSON()
			]
		});
	});
