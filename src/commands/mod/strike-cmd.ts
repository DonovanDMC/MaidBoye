import Command from "@cmd/Command";
import UserConfig from "@db/Models/User/UserConfig";
import db from "@db";
import config from "@config";
import Eris from "eris";

export default new Command("strike")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageMessages")
	.setDescription("Add a strike or several to a user")
	.setUsage("<user> [amount]")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to strike",
			required: true
		},
		{
			type: Eris.Constants.CommandOptionTypes.INTEGER,
			name: "amount",
			description: "The amount of strikes to give the user",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const member = await msg.getMemberFromArgs();
		const amount = msg.args.length === 1 ? 1 : Number(msg.args[1]);
		if (member === null) return msg.reply("Th-that wasn't a valid member..");
		if (member.id === msg.author.id) return msg.reply("H-hey! You can't strike yourself!");
		const c = msg.member.compareToMember(member);
		if (c !== "lower") return msg.reply("H-hey! You can't strike people higher than you!");
		if (amount < 1) return msg.reply("Y-you have to add at least one strike..");
		if (amount > 10 && !config.developers.includes(msg.author.id)) return msg.reply("Y-you cannot add more than 10 strikes at a time..");
		await db.createUserIfNotExists(member.id);
		await UserConfig.prototype.addStrikes.call({
			id: member.id
		}, msg.channel.guild.id, msg.author.id, amount);
		const count = await UserConfig.prototype.getStrikeCount.call({
			id: member.id
		}, msg.channel.guild.id);
		if (msg.gConfig.settings.deleteModCommands && msg.channel.guild.permissionsOf(this.user.id)) await msg.delete().catch(() => null);
		return msg.reply({
			content: `Successfully added **${amount}** strike${amount !== 1 ? "s" : ""} to <@!${member.id}>, they now have **${count}** strike${count !== 1 ? "s" : ""}`,
			allowedMentions: {
				users: false
			}
		});
	});
