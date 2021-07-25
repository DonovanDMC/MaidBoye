import Command from "@cmd/Command";
import { ApplicationCommandOptionType } from "discord-api-types";
import UserConfig from "@db/Models/User/UserConfig";
import db from "@db";
import config from "@config";

export default new Command("strike")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageMessages")
	.setDescription("Add a strike or several to a user")
	.setUsage("<user> [amount]")
	.setHasSlashVariant(true)
	.setSlashCommandOptions([
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to strike",
			required: true
		},
		{
			type: ApplicationCommandOptionType.Integer,
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
		const c = member.compareToMember(msg.member);
		if (c !== "lower") return msg.reply("H-hey! You can't strike people higher than you!");
		if (amount < 1) return msg.reply("Y-you have to add at least one strike..");
		if (amount > 10 && !config.developers.includes(msg.author.id)) return msg.reply("Y-you cannot add more than 10 strikes at a time..");
		await db.createUserIfNotExists(member.id);
		const v = await UserConfig.prototype.addStrikes.call({
			id: member.id,
			getStrikeCount: UserConfig.prototype.getStrikeCount.bind({ id: member.id })
		}, msg.channel.guild.id, msg.author.id, amount);
		return msg.reply({
			content: `Successfully added **${amount}** strike${amount !== 1 ? "s" : ""} to <@!${member.id}>, they now have **${v}** strike${v !== 1 ? "s" : ""}`,
			allowedMentions: {
				users: false
			}
		});
	});
