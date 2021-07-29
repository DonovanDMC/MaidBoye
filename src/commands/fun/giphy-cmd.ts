import Command from "@cmd/Command";
import config from "@config";
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
		const { data } = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${config.apiKeys.giphy}&q=${msg.args.join("%20")}&limit=50&offset=7&rating=PG-13&lang=en`, {
			method: "GET",
			headers: {
				"User-Agent": config.userAgent
			},
			timeout: 5e3
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


		return msg.channel.createMessage({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`Giphy Search: ${Strings.truncate(msg.args.join(" "), 30)}`)
					.setImage(data[Math.floor(Math.random() * data.length)].images.fixed_width.url)
					.setTimestamp(new Date().toISOString())
					.setColor("gold")
					.setThumbnail("https://assets.maid.gay/PoweredByGiphy.png")
					.setFooter("Images are provided by giphy, we are not responsible for their content.")
					.toJSON()
			]
		});
	});
