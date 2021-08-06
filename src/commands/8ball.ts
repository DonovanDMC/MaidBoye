import { APIApplicationCommandGuildInteraction, APIGuildMember, APIMessageComponentInteraction, APIUser, InteractionResponseType } from "discord-api-types";
import { RespondFunction } from "../types/other";
import { formatAvatar } from "../util";

const images = [
	// Neutral
	"https://assets.maid.gay/8Ball/Neutral1.png",
	"https://assets.maid.gay/8Ball/Neutral2.png",
	"https://assets.maid.gay/8Ball/Neutral3.png",

	// Positive
	"https://assets.maid.gay/8Ball/Positive1.png",
	"https://assets.maid.gay/8Ball/Positive2.png",
	"https://assets.maid.gay/8Ball/Positive3.png",

	// Negative
	"https://assets.maid.gay/8Ball/Negative1.png",
	"https://assets.maid.gay/8Ball/Negative2.png",
	"https://assets.maid.gay/8Ball/Negative3.png"
];
export function handleCommand (interaction: APIApplicationCommandGuildInteraction, member: APIGuildMember, user: APIUser, options: Record<string, string>, respond: RespondFunction<"command">): Response {
	if(!options.question) return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			flags: 64,
			content: "H-hey! You need to provide a question to ask.."
		}
	});

	const url = images[Math.floor(Math.random() * images.length)];

	return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			embeds: [
				{
					author: {
						name: `${user.username}#${user.discriminator}`,
						icon_url: formatAvatar(user, 2048)
					},
					image: {
						url
					},
					footer: {
						text: "Disclaimer: Do not take any answers seriously!",
						icon_url: BOT_ICON
					}
				}
			],
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 1,
							custom_id: `8ball-new.${user.id}`,
							label: "New Answer"
						},
						{
							type: 2,
							style: 1,
							custom_id: `8ball-exit.${user.id}`,
							emoji: {
								name: "\u274C",
								animated: false
							}
						}
					]
				}
			]
		}
	});
}

export function handleComponent(interaction: APIMessageComponentInteraction, member: APIGuildMember, user: APIUser, section: string, respond: RespondFunction<"component">): Response {
	switch(section) {
		case "new": {
			const url = images[Math.floor(Math.random() * images.length)];
			return respond({
				type: InteractionResponseType.UpdateMessage,
				data: {
					embeds: [
						{
							author: {
								name: `${user.username}#${user.discriminator}`,
								icon_url: formatAvatar(user, 2048)
							},
							image: {
								url
							},
							footer: {
								text: "Disclaimer: Do not take any answers seriously!",
								icon_url: BOT_ICON
							}
						}
					]
				}
			});
		}

		case "exit": {
			return respond({
				type: InteractionResponseType.UpdateMessage,
				data: {
					components: []
				}
			});
		}

		default: 
			return respond({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					flags: 64,
					content: `Unsupported interaction "${interaction.data.custom_id}"`
				}
			});
	}
}
