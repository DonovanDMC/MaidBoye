import Command from "../../util/cmd/Command";
import EmbedBuilder from "../../util/EmbedBuilder";
import config from "../../config";


export default new Command("avatar")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Get someone's avatar..")
	.setUsage("<@user>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const user = msg.args.length === 0 ? msg.author : await msg.getUserFromArgs();
		if (user === null) return msg.reply("Th-that isn't a valid user..");

		return msg.reply({
			embed: new EmbedBuilder()
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setTitle(`Avatar of ${user.tag}`)
				.setDescription(`[[512x512](${user.dynamicAvatarURL(undefined, 512)})] [[1024x1024](${user.dynamicAvatarURL(undefined, 1024)})]\n[[2048x2048](${user.dynamicAvatarURL(undefined, 2048)})] [[4096x4096](${user.dynamicAvatarURL(undefined, 4096)})]${user.id === this.user.id ? `\n\nIf you want to see the full version of my avatar, you can see it [here](${config.images.botFull}).` : ""}`)
				.setImage(user.dynamicAvatarURL(undefined, 4096))
				.toJSON()
		});
	});
