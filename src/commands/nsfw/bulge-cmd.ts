import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";
import Eris, { DiscordRESTError } from "eris";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import ErrorHandler from "@util/handlers/ErrorHandler";

export default new Command("bulge")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Bolgy wolgy uwu")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setRestrictions("nsfw")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		try {
			let m: Eris.Message<Eris.GuildTextableChannel> | undefined;
			async function refreshImage(this: MaidBoye, id?: string, token?: string): Promise<void> {
				const y = await Yiffy.furry.bulge("json", 1);
				const e = new EmbedBuilder()
					.setTitle("Bolgy Wolgy UwU")
				// url buttons
				/* .setDescription(
					`[[Short URL]](${y.shortURL})`,
					`[[Report]](${y.reportURL})`,
					`${y.sources.length === 0 ? "[No Source]" : `[[Source]](${y.sources[0]})`}`
				) */
					.setImage(y.url)
					.setColor("gold")
					.toJSON();
				const c = new ComponentHelper()
					.addURLButton(y.shortURL, false, undefined, "Full Image")
					.addURLButton(y.sources[0] || "https://yiff.rest", y.sources.length === 0, undefined, "Source")
					.addURLButton(y.reportURL, false, undefined, "Report")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `new-image.${msg.author.id}`, false, undefined, "New Image")
					.toJSON();
				if (m === undefined) m = await msg.reply({
					embeds: [e],
					components: c
				});
				else {
					if (!id || !token) return;
					await this.createInteractionResponse(id, token, {
						type: Eris.Constants.InteractionResponseTypes.UPDATE_MESSAGE,
						data: {
							embeds: [e],
							components: c
						}
					});
				}

				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.channelID === msg.channel.id && it.message.id === m!.id && it.data.custom_id.startsWith("new-image") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						content: m.content,
						embeds: m.embeds,
						components:  m.components?.slice(0, 1)
					});
				} else return refreshImage.call(this, wait.id, wait.token);
			}

			void refreshImage.call(this);
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
