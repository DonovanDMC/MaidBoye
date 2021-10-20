import Command from "@cmd/Command";
import { apiKeys, emojis, userAgent } from "@config";
import type MaidBoye from "@MaidBoye";
import ComponentHelper from "@util/components/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import { Strings } from "@uwu-codes/utils";
import fetch from "node-fetch";


export default new Command("giphy")
	.setPermissions("bot", "embedLinks")
	.setDescription("Search for a gif on giphy")
	.setUsage("<query>")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply("H-hey! You have to provide something to search..");
		const { data } = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKeys.giphy}&q=${msg.args.join("%20")}&limit=50&offset=7&rating=G&lang=en`, {
			method: "GET",
			headers: {
				"User-Agent": userAgent
			}
		}).then(v => v.json() as Promise<{
			data: Array<{ // there's more but I dont' care
				images: {
					fixed_width: {
						url: string;
					};
				};
			}>;
		}>);

		if (data.length === 0) return msg.reply("That query returned no results..");

		const m = await msg.reply("Warming up..");
		async function main(this: MaidBoye, img: number) {
			await m.edit({
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle(`Giphy Search: ${Strings.truncate(msg.args.join(" "), 30)}`)
						.setImage(data[img].images.fixed_width.url)
						.setTimestamp(new Date().toISOString())
						.setColor("gold")
						.setThumbnail("https://assets.maid.gay/PoweredByGiphy.png")
						.setFooter("Images are provided by giphy, we are not responsible for their content.")
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `giphy-first.${msg.author.id}`, img === 0, ComponentHelper.emojiToPartial(emojis.default.first, "default"))
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `giphy-prev.${msg.author.id}`, img === 0, ComponentHelper.emojiToPartial(emojis.default.back, "default"))
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `giphy-stop.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"))
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `giphy-next.${msg.author.id}`, img === data.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"))
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `giphy-last.${msg.author.id}`, img === data.length, ComponentHelper.emojiToPartial(emojis.default.last, "default"))
					.toJSON()
			});
			const wait = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
			if (wait === null || wait.data.custom_id.includes("stop")) {
				if (wait) await wait.acknowledge();
				return m.edit({ components: [] });
			} else {
				if (wait.data.custom_id.includes("first")) void main.call(this, 0);
				else if (wait.data.custom_id.includes("prev")) void main.call(this, img  - 1);
				else if (wait.data.custom_id.includes("next")) void main.call(this, img + 1);
				else if (wait.data.custom_id.includes("last")) void main.call(this, data.length);
			}
		}

		void main.call(this, 0);
	});
