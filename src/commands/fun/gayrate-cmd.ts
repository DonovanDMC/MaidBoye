import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";


export default new Command("gayrate")
	.setPermissions("bot", "embedLinks")
	.setDescription("Rate someone's gayness")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const member = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		if (member === null) return msg.reply("H-hey! That wasn't a valid member..");

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`${member.tag}'s Gayness`)
					.setDescription(`**${member.tag}** is ${Math.floor(Math.random() * 101)}% gay!`)
					.setThumbnail("https://assets.maid.gay/Gay.png")
					.toJSON()
			]
		});
	});
