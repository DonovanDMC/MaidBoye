import { APIApplicationCommandGuildInteraction, APIGuildMember, APIMessageComponentInteraction, APIUser, InteractionResponseType } from "discord-api-types";
import EmbedBuilder from "../EmbedBuilder";
import { RespondFunction } from "../types/other";


export function handleCommand (interaction: APIApplicationCommandGuildInteraction, member: APIGuildMember, user: APIUser, options: Record<string, string>, respond: RespondFunction<"command">): Response {
	return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			flags: 64,
			embeds: [
				new EmbedBuilder(true, user)
				.setTitle("Command List")
				.setDescription([
						"`/help` - List my commands",
						"`/8ball <question>` - Ask the magic 8ball",
						"`/bellyrub <@user>` - Rub someone's belly",
						"`/blep` - Stick your tongue out",
						"`/boop <@user>` - Boop someone",
						"`/cuddle <@user>` - Cuddle someone",
						"`/dictionary <@user>` - Throw the dictionary at someone",
						"`/flop <@user>` - Flop onto someone",
						"`/glomp <@user>` - Glomp someone",
						"`/huff <@user>` - Blow someone's house down",
						"`/hug <@user>` - Hug someone",
						"`/kiss <@user>` - Kiss someone",
						"`/lick <@user>` - Lick someone",
						"`/nap <@user>` - Take a nap on someone",
						"`/nuzzle <@user>` - Nuzzle someone",
						"`/pat <@user>` - Pat someone's head",
						"`/poke <@user>` - Poke someone",
						"`/pounce <@user>` - Pounce onto someone",
						"`/slap <@user>` - Slap someone",
						"`/sniff <@user>` - Sniff someone",
						"`/snowball <@user>` - Throw a snowball at someone",
						"`/spray <@user>` - Spray someone with water"
					])
					.toJSON()
			]
		}
	});
}

export function handleComponent(interaction: APIMessageComponentInteraction, member: APIGuildMember, user: APIUser, section: string, respond: RespondFunction<"component">): Response {
	return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			flags: 64,
			content: "This command does not have any components."
		}
	});
}
