import Command from "@cmd/Command";
import type MaidBoye from "@MaidBoye";
import ComponentHelper from "@util/components/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris, { DiscordRESTError } from "eris";
import ErrorHandler from "@handlers/ErrorHandler";
import { emojis } from "@config";

export default new Command("awoo", "howl")
	.setPermissions("bot", "embedLinks", "useExternalEmojis")
	.setDescription("Start a howl, or join one")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		try {
			const e = new EmbedBuilder(true, msg.author)
				.setTitle("Active Howl")
				.setDescription(`Howl Started By: <@!${msg.author.id}>\n${emojis.custom.awoo}\nCurrent Furs: **1**`);
			const m = await msg.reply({
				embeds: [
					e.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, "awoo-join", false, ComponentHelper.emojiToPartial(emojis.custom.awoo, "custom"), "Join Howl")
					.toJSON()
			});


			const current = [] as Array<string>;
			async function awaitJoin(this: MaidBoye) {
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.message.id === m.id && it.data.custom_id === "awoo-join");
				if (wait === null) {
					await m.edit({
						embeds: [
							e
								.setTitle("Howl Ended")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					if (current.includes(wait.member!.id) || wait.member!.id === msg.author.id) {
						void wait.createMessage({
							content: "You are already in this howl!",
							flags: 64
						});
					} else {
						current.push(wait.member!.id);
						await wait.acknowledge();
						void m.edit({
							embeds: [
								e
									.setDescription(`Howl Started By: <@!${msg.author.id}>\nCurrent Furs: **${current.length + 1}**\n${emojis.custom.awoo.repeat(current.length + 1)}\n${current.map((c, i) => `<@!${c}> joined a howl with **${i + 1}** fur${(i + 1) !== 1 ? "s" : ""}`).join("\n")}`)
									.toJSON()
							]
						});

					}
					void awaitJoin.call(this);
				}
			}

			void awaitJoin.call(this);
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
