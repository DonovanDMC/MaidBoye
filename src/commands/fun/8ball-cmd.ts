import Command from "@cmd/Command";
import config from "@config";
import MaidBoye from "@MaidBoye";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import { ApplicationCommandOptionType } from "discord-api-types";

const answers = [
	["Outlook Good", "https://indra.com/8ball/images/1.gif"],
	["Reply Hazy, Try Again", "https://indra.com/8ball/images/2.gif"],
	["Outlook Not So Good", "https://indra.com/8ball/images/3.gif"],
	["Most Likely", "https://indra.com/8ball/images/4.gif"],
	["As I See It, Yes", "https://indra.com/8ball/images/5.gif"],
	["Don't Count On It", "https://indra.com/8ball/images/6.gif"],
	["Concentrate And Ask Again", "https://indra.com/8ball/images/7.gif"],
	["It Is Certain", "https://indra.com/8ball/images/8.gif"],
	["It Is Decidedly So", "https://indra.com/8ball/images/9.gif"],
	["My Reply Is No", "https://indra.com/8ball/images/10.gif"],
	["Without A Doubt", "https://indra.com/8ball/images/11.gif"],
	["Cannot Predict Now", "https://indra.com/8ball/images/12.gif"],
	["Better Not Tell You Now", "https://indra.com/8ball/images/13.gif"],
	["Very Doubtful", "https://indra.com/8ball/images/14.gif"],
	["Signs Point To Yes", "https://indra.com/8ball/images/15.gif"],
	["Yes, Definitely", "https://indra.com/8ball/images/16.gif"],
	["Yes", "https://indra.com/8ball/images/17.gif"],
	["You May Rely On It", "https://indra.com/8ball/images/18.gif"],
	["My Sources Say No", "https://indra.com/8ball/images/19.gif"],
	["Ask Again Later", "https://indra.com/8ball/images/20.gif"]
];

export default new Command("8ball")
	.setPermissions("bot", "embedLinks")
	.setDescription("Ask the magic 8 ball")
	.setUsage("<question>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.String,
			name: "question",
			description: "The question to ask the magic 8ball.",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length === 0) return msg.reply("H-hey! You have to provide a question to ask..");
		const m = await msg.reply("Warning up..");
		async function main(this: MaidBoye) {
			const [text, image] = answers[Math.floor(Math.random() * answers.length)];
			await m.edit({
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("8ball Question")
						.setDescription(text)
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
