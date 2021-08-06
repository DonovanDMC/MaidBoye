import Command from "@cmd/Command";
import config from "@config";
import MaidBoye from "@MaidBoye";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";

const answers = [
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

// Image Credit: Raypop#2504
export default new Command("8ball")
	.setPermissions("bot", "embedLinks")
	.setDescription("Ask the magic 8 ball")
	.setUsage("<question>")
	.setSlashOptions("lite", [
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "question",
			description: "The question to ask the magic 8ball.",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length === 0) return msg.reply("H-hey! You have to provide a question to ask..");
		const m = await msg.reply("Warming up..");
		async function main(this: MaidBoye) {
			const image = answers[Math.floor(Math.random() * answers.length)];
			await m.edit({
				content: "",
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("8ball Question")
						.setImage(image)
						.setFooter("Disclaimer: Do not take any answers seriously!")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `8ball-new.${msg.author.id}`, undefined, undefined, "New Answer")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `8ball-exit.${msg.author.id}`, undefined, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Exit")
					.toJSON()
			});
			const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.data.custom_id.startsWith("8ball-") && it.message.id === m.id && it.member!.id === msg.author.id);
			if (wait === null) {
				await m.edit({
					components: []
				});
				return;
			} else {
				await wait.acknowledge();
				if (wait.data.custom_id.includes("new")) void main.call(this);
				else {
					await m.edit({
						components: []
					});
				}
			}
		}

		void main.call(this);
	});
