import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";

// for those who think I'm a feminist or something for not including "goodgirl":
// https://butts-are.cool/DiscordCanary_07-28-2021_19-28-37.png
// this is almost ALWAYS said as "boy", reguardless of gender
export default new Command("whosagoodboi", "whosagoodboy", "goodboi", "goodboy")
	.setPermissions("bot", "embedLinks")
	.setDescription("Who's a good boye?!?")
	.setUsage("[@user/text]")
	.setHasSlashVariant(false)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Who's A Good Boye?!?")
					.setDescription(msg.args.length === 0 ? "You are! You're a good boye!" : msg.args.join(" ").includes(this.user.id) ? "N-no! I am NOT a good boye.. nwn" : `${msg.args.join(" ")} is a good boye!`)
					.toJSON()
			]
		});
	});
