import Command from "@cmd/Command";
import { ApplicationCommandOptionType } from "discord-api-types";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import Eris from "eris";
import chunk from "chunk";

export default new Command("inspect")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageMessages")
	.setDescription("Get the moderation info of a user")
	.setUsage("<user>")
	.setHasSlashVariant(true)
	.setSlashCommandOptions([
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to inspect",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const member = await msg.getMemberFromArgs();
		if (member === null) return msg.reply("Th-that wasn't a valid member..");
		const user = await db.getUser(member.id);
		const strikes = await user.getStrikes(msg.channel.guild.id, true);
		const pStrike = chunk(strikes, 5);
		console.log(pStrike);
		const mlog = await user.getModlogEntries(msg.gConfig);

		const m = await msg.reply("Warming up..");
		async function main(this: MaidBoye) {
			await m.edit({
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle(`Inspection: ${member!.tag}`)
						.setDescription(
							`Total Strikes: **${strikes.length}**`,
							`Total ModLog Entries: **${mlog.length}**`
						)
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-strikes.${msg.author.id}`, false, undefined, "Strike History")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-modlog.${msg.author.id}`, false, undefined, "Moderation History")
					.toJSON()
			});
			const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("inspect-") && it.message.id === m.id && it.member.user.id === msg.author.id);
			if (wait === null) {
				await m.edit({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("Menu Closed")
							.setDescription("Closed due to interaction timeout.")
							.setColor("red")
							.toJSON()
					]
				});
				return;
			} else {
				await this.createInteractionResponse(wait.id, wait.token, Eris.InteractionCallbackType.DEFERRED_UPDATE_MESSAGE);
				if (wait.data.custom_id.includes("strikes")) void strikeHistory.call(this);
				else if (wait.data.custom_id.includes("moderation")) void moderationHistory.call(this);
				else return;
			}
		}

		async function strikeHistory(this: MaidBoye) {
			// @TODO
		}

		async function moderationHistory(this: MaidBoye) {
			// @TODO
		}

		void main.call(this);

	});
