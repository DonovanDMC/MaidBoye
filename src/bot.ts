// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/constants.d.ts" />
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APIApplicationCommandGuildInteraction, APIInteractionResponse, APIMessageComponentGuildInteraction, APIPingInteraction,  ApplicationCommandOptionType, InteractionResponseType, InteractionType } from "discord-api-types";
import { verify } from "./verify";
import * as magic8ball from "./commands/8ball";

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
				case "8ball": return magic8ball.handleCommand(interaction, member, user, options, respond);

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
				case "8ball": return magic8ball.handleComponent(interaction, member, user, section, respond);

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
