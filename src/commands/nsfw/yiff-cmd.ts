import GuildConfig from "@db/Models/Guild/GuildConfig";
import ErrorHandler from "@util/handlers/ErrorHandler";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import config from "@config";
import Logger from "@util/Logger";
import Yiffy from "@util/req/Yiffy";
import { Strings } from "@uwu-codes/utils";
import Eris, { DiscordRESTError } from "eris";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";

export default new Command("yiff", "thegoodstuff")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Y-you know what this is..")
	.setUsage(`<${config.yiffTypes.join("/")}>`)
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "type",
			description: "The type of yiff to fetch",
			required: false,
			choices: config.yiffTypes.map(y => ({
				name: Strings.ucwords(y),
				value: y
			}))
		}
	])
	.setRestrictions("nsfw")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		try {
			let type: Exclude<GuildConfig["settings"]["defaultYiffType"], null>;
			if (msg.args.length === 0) {
				if (msg.gConfig.settings.defaultYiffType === null) type = config.yiffTypes[0];
				else {
					if (!config.yiffTypes.includes(msg.gConfig.settings.defaultYiffType)) {
						Logger.getLogger("YiffCommand").warn(`Unknown Default Yiff Type "${msg.gConfig.settings.defaultYiffType}" on guild ${msg.channel.guild.id}`);
						await msg.gConfig.edit({
							settings: {
								defaultYiffType: config.yiffTypes[0]
							}
						});
						type = config.yiffTypes[0];
					} else type = msg.gConfig.settings.defaultYiffType;
				}
			} else {
				type = msg.args[0].toLowerCase() as typeof type;
				if (!config.yiffTypes.includes(type)) return msg.reply(`Th-that wasn't a valid yiff type! You can use \`${msg.gConfig.getFormattedPrefix()}help yiff\` to see them..`);
			}


			// I'm proud of this
			let m: Eris.Message<Eris.GuildTextableChannel> | undefined;
			async function refreshImage(this: MaidBoye, id?: string, token?: string): Promise<void> {
				const y = await Yiffy.furry.yiff[type]("json", 1);
				const e = new EmbedBuilder()
					.setTitle(`${Strings.ucwords(type)} Yiff!`)
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
					content: "H-here's your yiff!",
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
					return;
				} else return refreshImage.call(this, wait.id, wait.token);
			}

			void refreshImage.call(this);
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
