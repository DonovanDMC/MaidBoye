import Command from "@cmd/Command";
import { botIcon, kofiLink } from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import crypto from "crypto";

export default new Command("donate")
	.setPermissions("bot", "embedLinks")
	.setDescription("support us, if you feel like it..")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args[0]?.toLowerCase() === "set-email") {
			const dm = await msg.author.getDMChannel();
			const d = await dm.createMessage("Please send the email associated with your ko-fi account. This will be securely stored as a hex digested md5 hash.").catch(err => err as Error);
			if (d instanceof Error) return msg.reply(`I failed to dm you, please make sure I'm not blocked and your dms are open.\n\`\`\`\n${d.name}: ${d.message}\`\`\``);
			const m = await msg.reply("Please check your direct messages for instructions.");
			const w = await dm.awaitMessages(6e4);
			if (w === null) {
				await d.delete();
				await m.edit("You took too long to respond.");
				return;
			}
			await msg.uConfig.edit({
				donations: {
					kofiEmail: crypto.createHash("md5").update(d.content).digest("hex")
				}
			});
			await d.edit("Done, thank you.");
			await m.edit("congrats, you're all set up to have your donations credited now.");
		}

		if (msg.uConfig.donations.kofiEmail === null) await msg.reply(`Warning! You do not have your ko-fi email set, donations will not be credited to you!\nTo set it, run \`${msg.gConfig.getFormattedPrefix()}donate set-email\` and follow the instructions.`);

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Donate")
					.setAuthor("Maid Boye", botIcon, kofiLink)
					.setDescription(`[Donate At Ko-Fi](${kofiLink})`)
					.setImage("https://cdn.ko-fi.com/cdn/kofi1.png?v=2")
					.toJSON()
			]
		});
	});
