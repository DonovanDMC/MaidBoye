import Command from "@cmd/Command";
import config from "@config";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import chunk from "chunk";
import Settings, { ExecReturn } from "@util/Settings";
import MaidBoye from "@MaidBoye";
import Eris from "eris";
import { Strings } from "@uwu-codes/utils";
import { APIMessageSelectMenuInteractionData } from "discord-api-types";

export default new Command("settings")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageGuild")
	.setDescription("manage this server's settings")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		let page = 1;
		const pages = chunk(Settings, 3);
		/* 	const pages = [
			{
				embeds: [
					new EmbedBuilder()
						.setTitle("Server Settings")
						.setDescription(
							"**Default Yiff Type**",
							`Current Value: \`${msg.gConfig.settings.defaultYiffType ?? "None"}\``,
							"",
							"**Yiff Thumbnail Type**",
							`Current Value: \`${msg.gConfig.settings.yiffThumbnailType}\``,
							"",
							"**Mute Role**",
							`Current Value: ${msg.gConfig.settings.muteRole === null ? "`None`" : `<@&${msg.gConfig.settings.muteRole}>`}`
						)
						.setFooter(`UwU | Page 1/${totalPages}`)
						.toJSON()
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${msg.author.id}`, true, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-configure.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.custom.settings, "custom"), "Configure")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-next.${msg.author.id}`, true, ComponentHelper.emojiToPartial(config.emojis.default.next, "default"), "Next Page")
					.toJSON()
			}
		] as Array<Eris.MessageContent>; */
		function formatEmbed(v: typeof Settings) {
			return new EmbedBuilder(true, msg.author)
				.setTitle("Server Settings")
				.setDescription(
					v.map(s => [
						`${s.name === "Default Yiff Type" && msg.channel.nsfw ? config.emojis.custom.knot : s.emoji?.value ?? ""} **${s.name}**`,
						`${config.emojis.default.dot} Current Value: ${s.displayFormat(msg.gConfig)}`,
						`${config.emojis.default.dot} Valid Values: ${s.validValuesDescription}`,
						`${config.emojis.default.dot} Description: ${s.description}`,
						""
					].join("\n")).join("\n")
				)
				.setFooter(`UwU | Page ${page}/${pages.length}`)
				.toJSON();
		}

		const m = await msg.reply("Warming up..");

		async function changePage(this: MaidBoye, id?: string, token?: string): Promise<void> {
			const body = {
				content: "",
				embeds: [
					formatEmbed(pages[page - 1])
				],
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${msg.author.id}`, page === 1, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-configure.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.custom.settings, "custom"), "Configure")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Exit")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-next.${msg.author.id}`, page  === pages.length, ComponentHelper.emojiToPartial(config.emojis.default.next, "default"), "Next")
					.toJSON()
				// string (MessageContent) isn't assignable to InteractionPayload
			} as Eris.AdvancedMessageContent;
			if (id && token) await this.createInteractionResponse(id, token, Eris.InteractionCallbackType.UPDATE_MESSAGE, body);
			else await m.edit(body);
			const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member.user.id === msg.author.id && it.message.id === m.id);
			if (wait === null) return void m.edit({
				content: "",
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("Server Settings")
						.setDescription("Menu closed due to time out.")
						.toJSON()
				],
				components: []
			}); else {
				//  disabled buttons should keep this from going to an invalid page
				if (wait.data.custom_id.includes("back")) {
					page--;
					return void changePage.call(this, wait.id, wait.token);
				} else if (wait.data.custom_id.includes("next")) {
					page++;
					return void changePage.call(this, wait.id, wait.token);
				} else if (wait.data.custom_id.includes("configure")) {
					const e = await configure.call(this, wait.id, wait.token);
					if (e[0] === false) return;
					else {
						// give them time to read the response
						if (e[1] === true) await new Promise(a => setTimeout(a, 3e3, undefined));
						return void changePage.call(this);
					}
				} else return void this.createInteractionResponse(wait.id, wait.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, {
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("Server Settings")
							.setDescription("Exited.")
							.toJSON()
					],
					components: []
				});
			}
		}

		async function configure(this: MaidBoye, id: string, token: string): Promise<ExecReturn> {
			await this.createInteractionResponse(id, token, Eris.InteractionCallbackType.UPDATE_MESSAGE, {
				content: "",
				embeds: [
					formatEmbed(pages[page - 1])
				],
				components: new ComponentHelper()
					.addSelectMenu(`settings-select.${msg.author.id}`, pages[page - 1].map(s => ({
						label: s.name,
						value: s.name.replace(/\s/g, "-").toLowerCase(),
						// thanks Discord
						description: Strings.truncate(s.shortDescription ?? s.description, 50),
						emoji: s.emoji === null ? undefined : ComponentHelper.emojiToPartial(s.name === "Default Yiff Type" && msg.channel.nsfw ? config.emojis.custom.knot : s.emoji.value, s.emoji.type)
					})), "Select A Setting To Configure", 1, 1)
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `settings-exit.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Exit")
					.toJSON()
			});
			const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.data.custom_id.startsWith("settings-") && it.member.user.id === msg.author.id && it.message.id === m.id);
			if (wait === null) {
				await m.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle("Server Settings")
							.setDescription("Menu closed due to time out.")
							.toJSON()
					],
					components: []
				});
				return [false, false];
			} else {
				if (wait.data.custom_id.includes("exit")) {
					await this.createInteractionResponse(wait.id, wait.token, Eris.InteractionCallbackType.UPDATE_MESSAGE, {
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Server Settings")
								.setDescription("Exited.")
								.toJSON()
						],
						components: []
					});
					return [false, false];
				}
				await this.createInteractionResponse(wait.id, wait.token, Eris.InteractionCallbackType.DEFERRED_UPDATE_MESSAGE);
				const { values: v } = (wait.data as APIMessageSelectMenuInteractionData);
				const n = Settings.find(s => s.name.replace(/\s/g, "-").toLowerCase() === v[0]);
				if (n === undefined) {
					await m.edit({
						content: "There was an internal error..",
						embeds: [],
						components: []
					});
					return [false, false];
				} else return n.exec(msg, m);
			}
		}

		void changePage.call(this);
	});
