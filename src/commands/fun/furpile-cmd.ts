import Logger from "../../util/Logger";
import Command from "@cmd/Command";
import Eris from "eris";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import { DiscordHTTPError } from "slash-create";

export default new Command("furpile")
	.setPermissions("bot", "embedLinks")
	.setDescription("Start a furpile, or join one")
	.setSlashOptions(true, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user",
			description: "The user to start a furpile on",
			required: true
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		try {
			if (msg.args.length === 0) return msg.reply("H-hey! A user is required to start a conga..");
			const member = await msg.getMemberFromArgs();
			if (member === null) return msg.reply("H-hey! That wasn't a valid member..");
			if (member.id === msg.author.id) return msg.reply("H-hey! You can't start a conga with yourself..");

			const e = new EmbedBuilder(true, msg.author)
				.setTitle("Active FurPile")
				.setDescription(`Furpile Started By: <@!${msg.author.id}> on <@!${member.id}>\n\nCurrent Furs: **2**`);
			const m = await msg.reply({
				embeds: [
					e.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, "furpile-join", false, undefined, "Join Furpile")
					.toJSON()
			});

			const current = [member.id];
			async function awaitJoin(this: MaidBoye) {
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.message.id === m.id && it.data.custom_id === "furpile-join");
				if (wait === null) {
					await m.edit({
						embeds: [
							e
								.setTitle("Furpile Ended")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					if (current.includes(wait.member!.id) || wait.member!.id === msg.author.id) {
						void wait.createMessage({
							content: "You are already in this furpile!",
							flags: 64
						});
					} else {
						current.push(wait.member!.id);
						await wait.acknowledge();
						void m.edit({
							embeds: [
								e
									.setDescription(`Furpile Started By: <@!${msg.author.id}> on <@!${member!.id}>\n\n${current.slice(1).map((c, i) => `<@!${c}> joined a conga with **${i + 2}** furs`).join("\n")}`)
									.toJSON()
							]
						});

					}
					void awaitJoin.call(this);
				}
			}

			void awaitJoin.call(this);
		} catch (err) {
			if (err instanceof DiscordHTTPError) {
				// Unknown message error
				if (err.code === 10008) {
					Logger.getLogger("FurpileCommand").error(err);
					return;
				}
			}

			throw err;
		}
	});
