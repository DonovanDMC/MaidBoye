/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APIApplicationCommandGuildInteraction, InteractionResponseType } from "discord-api-types";
import EmbedBuilder from "./EmbedBuilder";
import { RespondFunction } from "./types/other";
import { yiffyRequest } from "./util";

const funCommandResponses = (interaction: APIApplicationCommandGuildInteraction, options: Record<string, string>) => ({
	bap: [
		`<@!${interaction.member!.user.id}> smacks ${options.user} hard on the snoot with a rolled up news paper!`,
		`<@!${interaction.member!.user.id}> goes to smack ${options.user} on the snoot with a news paper, but missed and hit themself!`
	],
	bellyrub: [
		`<@!${interaction.member!.user.id}> rubs the belly of ${options.user}!`
	],
	blep: [
		`<@!${interaction.member!.user.id}> did a little blep!`,
		`<@!${interaction.member!.user.id}> stuck their tongue out cutely!`
	],
	boop: [
		`<@!${interaction.member!.user.id}> has booped ${options.user}!\nOwO`,
		`<@!${interaction.member!.user.id}> lightly pokes the nose of ${options.user}\nOwO`
	],
	cuddle: [
		`<@!${interaction.member!.user.id}> has cuddled ${options.user}!\nAren't they cute?`,
		`<@!${interaction.member!.user.id}> sneaks up behind ${options.user}, and cuddles them\nIsn't that sweet?`
	],
	dictionary: [
		`<@!${interaction.member!.user.id}> throws a dictionary at ${options.user} screaming "KNOWLEDGE"!`,
		`<@!${interaction.member!.user.id}> drops some knowledge on ${options.user}, with their dictionary!`,
		`<@!${interaction.member!.user.id}> drops their entire English folder onto ${options.user}, it seems to have flattened them!`
	],
	flop: [
		`<@!${interaction.member!.user.id}> flops over onto ${options.user}\nuwu`,
		`<@!${interaction.member!.user.id}> lays on ${options.user}.. owo`
	],
	glomp: [
		`<@!${interaction.member!.user.id}> pounces on ${options.user}, tackling them to the floor in a giant hug!`
	],
	huff: [
		`<@!${interaction.member!.user.id}> huffed, and puffed, and blew ${options.user}'s house down!`
	],
	hug: [
		`<@!${interaction.member!.user.id}> sneaks up being ${options.user}, and when they aren't looking, tackles them from behind in the biggest hug ever!`,
		`<@!${interaction.member!.user.id}> gently wraps their arms around ${options.user}, giving them a big warm hug!`
	],
	kiss: [
		`<@!${interaction.member!.user.id}> kisses ${options.user}, how cute!`
	],
	lick: [
		`<@!${interaction.member!.user.id}> licks ${options.user}\nUwU`,
		`<@!${interaction.member!.user.id}> decides to make ${options.user}'s fur a little slimy...`
	],
	nap: [
		`<@!${interaction.member!.user.id}> decided to take a nap on ${options.user}.. ${options.user} might need a forklift for this one!`
	],
	nuzzle: [
		`<@!${interaction.member!.user.id}> nuzzles ${options.user} gently`
	],
	pat: [
		`<@!${interaction.member!.user.id}> pats ${options.user} on the head for being a good boi`,
		`<@!${interaction.member!.user.id}> gently pats ${options.user}`
	],
	poke: [
		`<@!${interaction.member!.user.id}> pokes ${options.user}\nDon't make them mad..`
	],
	pounce: [
		`<@!${interaction.member!.user.id}> pounces onto ${options.user} uwu`
	],
	sniff: [
		// rip siff
		`<@!${interaction.member!.user.id}> sniffs ${options.user}\nMaybe they smell good..?`
	],
	slap: [
		`<@!${interaction.member!.user.id}> slaps ${options.user}.. ouch`
	],
	snowball: [
		`<@!${interaction.member!.user.id}> throws a snowball at ${options.user}!`
	],
	spray: [
		`<@!${interaction.member!.user.id}> sprays ${options.user} with a bottle of water, while yelling "bad fur"!`
	],
	wag: [
		`<@!${interaction.member!.user.id}> wags their little tail, aren't they cute ^w^`
	]
});

export async function genericFunCommand(interaction: APIApplicationCommandGuildInteraction, options: Record<string, string>, name: keyof ReturnType<typeof funCommandResponses>, respond: RespondFunction<"command">): Promise<Response> {
	const r = funCommandResponses(interaction, options)[name];

	const embed = new EmbedBuilder(true, interaction.member!.user)
		.setDescription(!r ? "Failed To Look Up Language String " : r[Math.floor(Math.random() * r.length)]);

	if (name === "bap") embed.setImage("https://assets.maid.gay/bap.gif");
	else if (name === "bellyrub") embed.setImage("https://assets.maid.gay/bellyrub.gif");
	// I can't get custom emojis to work
	// if (name === "spray") embed.setDescription(`${embed.getDescription()!}\n${"<:spray:869548937181270036>".repeat(Math.floor(Math.random() * 3) + 2)}`);
	if (name === "spray") embed.setThumbnail("https://cdn.discordapp.com/emojis/869548937181270036.png?v=1");
	else if(["boop", "cuddle", "flop", "hug", "kiss", "lick"].includes(name)) {
		const { url } = await yiffyRequest(`/furry/${name}`);
		embed.setImage(url);
	} else if(name === "blep") {
		const { url } = await yiffyRequest("/animals/blep");
		embed.setImage(url);
	}

	return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			embeds: [
				embed.toJSON()
			]
		}
	});
}
