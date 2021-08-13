import Command from "@cmd/Command";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import YiffRocks, { APIError } from "yiff-rocks";

export default new Command("shorten")
	.setPermissions("bot", "embedLinks")
	.setDescription("Shorten a url, using yiff.rocks")
	.setUsage("<url> [code]")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "url",
			description: "The url to shorten",
			required: true
		},
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "code",
			description: "The short code to use (none for random)",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply("H-hey! You have to provide a url to shorten..");
		if (msg.args[1] && msg.args[1].length > 50) return msg.reply("H-hey! That code was too long..");

		void YiffRocks.create(msg.args[0], `Discord:${msg.author.id}`, msg.args[1] || undefined, false)
			.then(
				(async(short) => msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("URL Shortened")
							.setDescription(`Code: \`${short.code}\`\nShort URL: [${short.fullURL}](${short.fullURL})`)
							.toJSON()
					],
					components: new ComponentHelper()
						.addURLButton(short.fullURL, false, undefined, "Open Link")
						.toJSON()
				})),
				(async(err: Error) => {
					if (err instanceof APIError) {
						if (err.obj === "Invalid url proided.") return msg.reply("H-hey! That url was invalid..");
						else if (err.obj === "Code already in use.") return msg.reply("H-hey! That code is already in use..");
						else return msg.reply(`Our api returned an unknown error.. \`${err.message}\`, ${typeof err.obj === "string" ? err.obj : JSON.stringify(err.obj)}`);
					}
				})
			);
	});
