/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APIApplicationCommandGuildInteraction, APIInteractionResponse, APIMessageComponentGuildInteraction, APIPingInteraction, APIUser, ApplicationCommandOptionType, InteractionResponseType, InteractionType } from "discord-api-types";
import { verify } from "./verify";

function formatAvatar(user: APIUser, size: number) {
	return `https://cdn.discordapp.com/${user.avatar === null ? `embed/avatars/${Number(user.discriminator) % 5}.png` : `avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=${size}`}`;
}

const magic8BallImages = [
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
export async function handleRequest(request: Request): Promise<Response> {
	if (!request.headers.get("X-Signature-Ed25519") || !request.headers.get("X-Signature-Timestamp")) return Response.redirect("https://maid.gay");
	if (!await verify(request)) return new Response("Unauthorized.", { status: 401 });
	const interaction = await request.json() as APIPingInteraction | APIApplicationCommandGuildInteraction | APIMessageComponentGuildInteraction;
	switch(interaction.type) {
		case InteractionType.Ping: return respond({
			type: InteractionResponseType.Pong
		});

		case InteractionType.ApplicationCommand: {
			const member = interaction.member;
			const user = member.user;
			if(!("guild_id" in interaction))  return respond({
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags: 64,
					content: "My commands cannot be used in direct messages, sorry.."
				}
			});
			const hasOptions = "options" in interaction.data && interaction.data.options!.length > 0;
			const options = (hasOptions ? interaction.data.options?.map(o => {
				switch(o.type) {
					case ApplicationCommandOptionType.Channel: return { [o.name] : `<#${o.value}>` };
					case ApplicationCommandOptionType.String:
					case ApplicationCommandOptionType.Integer:
					case ApplicationCommandOptionType.Number: return { [o.name]: String(o.value) };
					case ApplicationCommandOptionType.Role: return { [o.name]: `<@&${o.value}>` };
					case ApplicationCommandOptionType.User: return { [o.name]: `<@!${o.value}>` };
				}
			}).reduce((a,b) => ({ ...a, ...b })) : {})!;
			switch(interaction.data.name) {
				case "8ball": {
					if(!options.question) return respond({
						type: InteractionResponseType.DeferredChannelMessageWithSource,
						data: {
							flags: 64,
							content: "H-hey! You need to provide a question to ask.."
						}
					});

					const url = magic8BallImages[Math.floor(Math.random() * magic8BallImages.length)];
			
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

				default: return respond({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						flags: 64,
						content:`Unsupported command "${interaction.data.name}"`
					}
				});
			}
			break;
		}

		case InteractionType.MessageComponent: {
			const [main, userId] = interaction.data.custom_id.split(".");
			const [command, section] = main.split("-");
			const member = interaction.member;
			const user = member.user;
			if(userId !== user.id) return respond({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					flags: 64,
					content:"H-hey! That isn't your button to press.."
				}
			});
			switch(command) {
				case "8ball": {
					switch(section) {
						case "new": {
							const url = magic8BallImages[Math.floor(Math.random() * magic8BallImages.length)];
					
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
					break;
				}

				default: return respond({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						flags: 64,
						content:`Unsupported interaction "${interaction.data.custom_id}"`
					}
				});
			}
		}
	}
}

const respond = <T extends APIInteractionResponse>(response: T) => new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
