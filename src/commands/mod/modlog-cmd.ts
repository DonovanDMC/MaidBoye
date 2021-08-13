import EmbedBuilder from "../../util/EmbedBuilder";
import MaidBoye from "@MaidBoye";
import Command from "@cmd/Command";
import config from "@config";
import CommandError from "@cmd/CommandError";
import ModLogUtil from "@util/handlers/ModLogHandler";
import ComponentHelper from "@util/ComponentHelper";
import ComponentInteractionCollector from "@util/ComponentInteractionCollector";
import Eris, { DiscordRESTError } from "eris";
import { Request } from "@uwu-codes/utils";
import FileType from "file-type";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import ErrorHandler from "@util/handlers/ErrorHandler";

export default new Command("modlog")
	.setPermissions("bot", "embedLinks", "manageChannels", "manageWebhooks")
	.setPermissions("user", "manageGuild")
	.setDescription("Manage this server's modlog")
	.setUsage("(no arguments)")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.STRING,
			name: "section",
			description: "the section of modlog configuration to open",
			choices:[
				{
					name: "Setup",
					value: "setup"
				},
				{
					name: "Reset",
					value: "reset"
				},
				{
					name: "Get",
					value: "get"
				}
			]
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		try {
			if (msg.gConfig.modlog.enabled === true && msg.gConfig.modlog.webhook === null) await msg.gConfig.edit({
				modlog: config.defaults.guild.modlog
			});
			const m = await msg.reply({
				content: "Please select a section from below.\n\nIf you want to change a setting, you must use reset, then run setup again.",
				components: new ComponentHelper()
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlog-section-setup.${msg.author.id}`, false, undefined, "Setup")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlog-section-reset.${msg.author.id}`, false, undefined, "Reset")
					.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlog-section-get.${msg.author.id}`, false, undefined, "Info")
					.toJSON()
			});
			let skip = false, sect: string;
			if (msg.args.length !== 0 && ["setup", "reset", "get", "info"].includes(msg.args[0].toLowerCase())) {
				sect = msg.args[0].toLowerCase();
				skip = true;
				await m.edit({
					content: "Successfully selected, processing..",
					components: []
				});
			}
			if (skip === false) {
				const section = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channelID === msg.channel.id && it.message.id === m.id && it.data.custom_id.startsWith("modlog-section") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);
				if (section === null) return m.edit({
					content: "Selection timed out..",
					components: []
				});
				await section.editParent({
					content: "Successfully selected, processing..",
					components: []
				});
				sect = section.data.custom_id.split(".")[0].split("-")[2];
			}
			switch (sect!) {
				case "setup": {
					const check = await ModLogUtil.check(msg.gConfig);
					if (check === true) return msg.reply(`Th-this server's modlog has already been set up.. if you want to reset it, run \`${msg.gConfig.getFormattedPrefix()}modlog reset\``);

					await m.edit("Please respond with a channel to use. (default: this channel)");
					const j = await msg.channel.awaitMessages(3e4, (mg) => mg.author.id === msg.author.id);
					const ch = (!j ? msg.channel : await j.getChannelFromArgs(undefined, undefined, undefined, undefined, false)) as Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel>;
					if (ch === null) return msg.reply("Th-that wasn't a valid channel!");
					if (j && msg.channel.permissionsOf(this.user.id).has("manageMessages")) await j.delete().catch(() => null);

					await m.edit({
						content: `Please select one of the following to proceed.\n1.) Select an existing webhook (on <#${ch.id}>) to use for the modlog\n2.) Provide a direct url to a webhook\n3.) Create a new webhook (with me)`,
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-1.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.one, "default"), "One")
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-2.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.two, "default"), "Two")
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-3.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.three, "default"), "Three")
							.toJSON()
					});
					const sel = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channelID === msg.channel.id && it.message.id === m.id && it.data.custom_id.startsWith("select-modlogsetup") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);
					if (sel === null) return m.edit({
						content: "Y-you took too long to respond..",
						components: []
					});
					await sel.editParent({
						content: "Successfully selected, processing..",
						components: []
					});

					// eslint-disable-next-line no-inner-declarations
					async function configureOptions(this: MaidBoye, message: Eris.Message<Eris.GuildTextableChannel>) {
						const v = {
							...config.defaults.guild.modlog,
							enabled: true
						} as GuildConfig["modlog"];
						// ask defaults
						const selC = await message.channel.awaitComponentInteractions(3e4, (it) => it.channelID === msg.channel.id && it.message.id === message.id && it.data.custom_id.startsWith("modlogconfig") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);
						// defaults timeout
						if (selC === null) {
							await message.edit({
								content: "Detected timeout, using default configuration options. Setup complete!",
								components: []
							});
							return v;
							// defaults no
						} else if (selC.data.custom_id.indexOf("no") !== -1) {
							await selC.editParent({
								content: "Using default configuration options. Setup complete!",
								components: []
							});
							return v;
						} else if (selC.data.custom_id.indexOf("cancel") !== -1) {
							await selC.editParent({
								content: "Setup has been cancelled.",
								components: []
							});
							return null;
						}

						// ask case editing
						await selC.editParent({
							content: "Do you want to enable **Case Editing** after cases have been made? (default: **yes**)",
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `configCaseEditing-yes.${msg.author.id}`, false, undefined, "Yes")
								.addInteractionButton(ComponentHelper.BUTTON_DANGER, `configCaseEditing-no.${msg.author.id}`, false, undefined, "No")
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `configCaseEditing-exit.${msg.author.id}`, false, undefined, "Exit")
								.toJSON()
						});
						// case editing collector
						const cnfCaseEditing = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channelID === msg.channel.id && it.message.id === message.id && it.data.custom_id.startsWith("configCaseEditing") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);

						// buttons for case deletion, for less code duplication
						const cnfCDComponents = new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `configCaseDeletion-yes.${msg.author.id}`, false, undefined, "Yes")
							.addInteractionButton(ComponentHelper.BUTTON_DANGER, `configCaseDeletion-no.${msg.author.id}`, false, undefined, "No")
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `configCaseDeletion-exit.${msg.author.id}`, false, undefined, "Exit")
							.toJSON();

						// case editing timeout
						if (cnfCaseEditing === null) await message.edit({
							content: `Detected timeout, using default value for **Case Editing** (${v.caseEditingEnabled ? "yes" : "no"}).\n\nNext: Do you want to enable **Case Deletion**? (default: **${v.caseDeletingEnabled ? "yes" : "no"}**)`,
							components: cnfCDComponents
						});
						// case editing no
						else if (cnfCaseEditing.data.custom_id.indexOf("no") !== -1) {
							await cnfCaseEditing.editParent({
								content: `**Case Editing** has been set to disabled.\n\nNext: Do you want to enable **Case Deletion**? (default: **${v.caseDeletingEnabled ? "yes" : "no"}**)`,
								components: cnfCDComponents
							});
							v.caseEditingEnabled = false;
							// case editing yes
						} else if (cnfCaseEditing.data.custom_id.indexOf("yes") !== -1) {
							await cnfCaseEditing.editParent({
								content: `**Case Editing** has been set to enabled.\n\nNext: Do you want to enable **Case Deletion**? (default: **${v.caseDeletingEnabled ? "yes" : "no"}**)`,
								components: cnfCDComponents
							});
							v.caseEditingEnabled = true;
							// case editing exit
						} else if (cnfCaseEditing.data.custom_id.indexOf("exit") !== -1) {
							await cnfCaseEditing.editParent({
								content: "Exiting.",
								components: []
							});
							return v;
						}
						// case deletion collector
						const cnfCaseDeletion = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channelID === msg.channel.id && it.message.id === message.id && it.data.custom_id.startsWith("configCaseDeletion") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);

						// buttons for edit others cases, for less code duplication
						const cnfEOCComponents = new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `configEditOthersCases-yes.${msg.author.id}`, false, undefined, "Yes")
							.addInteractionButton(ComponentHelper.BUTTON_DANGER, `configEditOthersCases-no.${msg.author.id}`, false, undefined, "No")
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `configEditOthersCases-exit.${msg.author.id}`, false, undefined, "Exit")
							.toJSON();

						// case deletion timeout
						if (cnfCaseDeletion === null) await message.edit({
							content: `Detected timeout, using default value for **Case Deletion** (${v.caseDeletingEnabled ? "yes" : "no"}).\n\nNext: Do you want to enable **Editing Others Cases**? (default: **${v.editOthersCasesEnabled ? "yes" : "no"}**)`,
							components: cnfEOCComponents
						});
						// case deletion no
						else if (cnfCaseDeletion.data.custom_id.indexOf("no") !== -1) {
							await cnfCaseDeletion.editParent({
								content: `**Case Deletion** has been set to disabled.\n\nNext: Do you want to enable **Editing Others Cases**? (default: **${v.editOthersCasesEnabled ? "yes" : "no"}**)`,
								components: cnfEOCComponents
							});
							v.caseDeletingEnabled = false;
							// case deletion yes
						} else if (cnfCaseDeletion.data.custom_id.indexOf("yes") !== -1) {
							await cnfCaseDeletion.editParent({
								content: `**Case Deletion** has been set to enabled.\n\nNext: Do you want to enable **Editing Others Cases**? (default: **${v.editOthersCasesEnabled ? "yes" : "no"}**)`,
								components: cnfEOCComponents
							});
							v.caseDeletingEnabled = true;
							// case deletion exit
						} else if (cnfCaseDeletion.data.custom_id.indexOf("exit") !== -1) {
							await cnfCaseDeletion.editParent({
								content: "Exiting.",
								components: []
							});
							return v;
						}
						// edit others cases collector
						const cnfEditOthersCases = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channelID === msg.channel.id && it.message.id === message.id && it.data.custom_id.startsWith("configEditOthersCases") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);

						// edit others cases timeout
						if (cnfEditOthersCases === null) await message.edit({
							content: `Detected timeout, using default value for **Edit Others Cases** (${v.editOthersCasesEnabled ? "yes" : "no"}).\n\nSetup is complete.`,
							components: []
						});
						// edit others cases no
						else if (cnfEditOthersCases.data.custom_id.indexOf("no") !== -1) {
							await cnfEditOthersCases.editParent({
								content: "**Edit Others Cases** has been set to disabled.\n\nSetup is complete.",
								components: []
							});
							v.editOthersCasesEnabled = false;
							// edit others cases yes
						} else if (cnfEditOthersCases.data.custom_id.indexOf("yes") !== -1) {
							await cnfEditOthersCases.editParent({
								content: "**Edit Others Cases** has been set to enabled.\n\nSetup is complete.",
								components: []
							});
							v.editOthersCasesEnabled = true;
							// edit others cases exit
						} else if (cnfEditOthersCases.data.custom_id.indexOf("exit") !== -1) {
							await cnfEditOthersCases.editParent({
								content: "Exiting.",
								components: []
							});
							return v;
						}

						return v;
					}
					let hook: Eris.Webhook;

					switch (Number(sel.data.custom_id.split(".")[0].split("-")[2])) {
					// select
						case 1: {
							const hooks = await ch.getWebhooks();
							if (hooks.length === 0) return m.edit("Th-that channel doesn't have any webhooks to use..");
							const c = new ComponentHelper();
							let i = 0;
							for (const w of hooks) {
								i++;
								c.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-webhook-${i - 1}.${msg.author.id}`, !w.token, ComponentHelper.emojiToPartial(config.emojis.default[config.names.number[i as unknown as "0"] as "zero"], "default"), w?.name || "Unknown");
								if ((i % 2) === 0) c.addRow();
							}
							// we somehow end up with no usable components
							if (c.toJSON().length === 0 || c.toJSON()[0].components.length === 0) return m.edit("Th-that channel doesn't have any webhooks to use..");
							await m.edit({
								content: "Please select a webhook from the following.\n(if the button is disabled, we couldn't get all of the info we needed about the webhook)",
								components: c.toJSON()
							});
							const selW = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 6e4, (it) => it.channelID === msg.channel.id && it.message.id === m.id && it.data.custom_id.startsWith("select-webhook") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);
							if (selW === null) return m.edit({
								content: "Y-you took too long to respond..",
								components: []
							});
							hook = hooks[Number(selW.data.custom_id.split(".")[0].split("-")[2])];
							if (!hook) return selW.editParent({
								content: "Internal error.",
								components: []
							});
							await selW.editParent({
								content: `Successfully selected the webhook **${hook.name}** (${hook.id})\nWould you like to configure the more detailed options, or leave them at their defaults?`,
								components: new ComponentHelper()
									.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `modlogconfig-yes.${msg.author.id}`, false, undefined, "Configure")
									.addInteractionButton(ComponentHelper.BUTTON_DANGER, `modlogconfig-no.${msg.author.id}`, false, undefined, "Defaults")
									.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlogconfig-cancel.${msg.author.id}`, false, undefined, "Cancel")
									.toJSON()
							});
							break;
						}

						// provide url
						case 2: {
							const hooks = await msg.channel.guild.getWebhooks();
							if (hooks.length === 0) return m.edit("Th-This server doesn't have any webhooks to use..");
							await m.edit("Please provide a full webhook url.");
							const wait = await msg.channel.awaitMessages(6e4, ({ author: { id } }) => id === msg.author.id, 1);
							if (wait === null) return m.edit({
								content: "Y-you took too long to respond.."
							});
							if (wait.content.toLowerCase() === "cancel") return m.edit("Cancelled.");
							const [ , id, token] = (/https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/(\d{15,21})\/([a-zA-Z\d_-]+)/.exec(wait.content) ?? [] as unknown) as  [_: never, id?: string, token?: string];
							if (!id || !token) return m.edit("The provided webhook url is not valid.");
							const w = hooks.find(v => v.id === id && v.token === v.token);
							if (w === undefined) return m.edit("The webhook you provided is either invalid, or not a part of this server.");
							hook = w;
							break;
						}

						// create
						case 3: {
							if (!ch.permissionsOf(this.user.id).has("manageWebhooks")) return m.edit("I-I'm missing the **Manage Webhooks** permission..");
							const img = await Request.getImageFromURL(config.images.bot);
							const { mime } = await FileType.fromBuffer(img) ?? { mime: null };
							if (mime === null) throw new Error("Internal error.");
							const b64 = Buffer.from(img).toString("base64");
							hook = await ch.createWebhook({
								name: "Maid Boye Moderation Log",
								avatar: `data:${mime};base64,${b64}`
							});
							await sel.editOriginalMessage({
								content: `Successfully created the webhook **${hook.name}** (${hook.id})\nWould you like to configure the more detailed options, or leave them at their defaults?`,
								components: new ComponentHelper()
									.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `modlogconfig-yes.${msg.author.id}`, false, undefined, "Configure")
									.addInteractionButton(ComponentHelper.BUTTON_DANGER, `modlogconfig-no.${msg.author.id}`, false, undefined, "Defaults")
									.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlogconfig-cancel.${msg.author.id}`, false, undefined, "Cancel")
									.toJSON()
							});
							break;
						}

						default: return msg.channel.createMessage("There was an internal error..");
					}


					const opt = await configureOptions.call(this, m);
					if (opt === null) return;
					opt.webhook = {
						id: hook.id,
						token: hook.token!,
						channelId: hook.channel_id!
					};
					await msg.gConfig.edit({
						modlog: opt
					});
					await this.executeWebhook(opt.webhook.id, opt.webhook.token, {
						embeds: [
							new EmbedBuilder()
								.setTitle("Modlog Configured")
								.setDescription(
									`This channel has been chosen for this servers modlog, by <@!${msg.author.id}>.`,
									"",
									"Settings:",
									`Case Editing Enabled: **${opt.caseEditingEnabled ? "Yes" : "No"}**`,
									`Case Deleting Enabled: **${opt.caseDeletingEnabled ? "Yes" : "No"}**`,
									`Edit Others Cases Enabled: **${opt.editOthersCasesEnabled ? "Yes" : "No"}**`
								)
								.setColor("gold")
								.toJSON()
						]
					});

					await m.edit({
						content: "Setup complete.",
						embeds: [],
						components: []
					});
					break;
				}

				case "reset": {
					if (msg.gConfig.modlog.enabled === false) return m.edit("H-hey! The modlog isn't enabled here..");
					if (msg.gConfig.modlog.webhook) {
						const wh = await this.getWebhook(msg.gConfig.modlog.webhook.id, msg.gConfig.modlog.webhook.token).catch(() => null);
						if (wh !== null) {
							await m.edit({
								content: `Do you want to delete the associated modlog webhook **${wh.name}** (${wh.id})?`,
								components: new ComponentHelper()
									.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `delhook-yes.${msg.author.id}`, false, undefined, "Yes")
									.addInteractionButton(ComponentHelper.BUTTON_DANGER, `delhook-no.${msg.author.id}`, false, undefined, "No")
									.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `delhook-cancel.${msg.author.id}`, false, undefined, "Cancel")
									.toJSON()
							});
							const delHook = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channelID === msg.channel.id && it.message.id === m.id && it.data.custom_id.startsWith("delhook") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);

							if (delHook === null) return m.edit({
								content: "Timeout detected, modlog has not been reset.",
								components: []
							});
							switch (delHook.data.custom_id.split("-")[1].split(".")[0]) {
								case "yes": {
									await this.deleteWebhook(msg.gConfig.modlog.webhook.id, msg.gConfig.modlog.webhook.token, `ModLog Reset: ${msg.author.tag} (${msg.author.id})`).catch(() => null);
									await msg.gConfig.edit({
										modlog: config.defaults.guild.modlog
									});
									return m.edit({
										content: "The webhook has been deleted, and the modlog was reset.",
										components: []
									});
									break;
								}
								case "no": {
									await msg.gConfig.edit({
										modlog: config.defaults.guild.modlog
									});
									return m.edit({
										content: "The webhook was not deleted, and the modlog was reset.",
										components: []
									});
									break;
								}
								case "cancel": return m.edit({
									content: "Cancelled.",
									components: []
								});
							}
						}
					}

					await msg.gConfig.edit({
						modlog: config.defaults.guild.modlog
					});
					await m.edit({
						content: "The modlog has been reset.",
						components: []
					});
					break;
				}

				case "info":
				case "get": {
					if (msg.gConfig.modlog.enabled === false || msg.gConfig.modlog.webhook === null) return m.edit("This server's modlog is not enabled.");
					const wh = await this.getWebhook(msg.gConfig.modlog.webhook.id, msg.gConfig.modlog.webhook.token);
					return m.edit({
						content: "",
						embeds: [
							new EmbedBuilder()
								.setTitle("ModLog Info")
								.setDescription(
									`Channel: <#${msg.gConfig.modlog.webhook.channelId}>`,
									"",
									"Settings:",
									`${config.emojis.default.dot} **Case Editing**: ${config.emojis.custom[msg.gConfig.modlog.caseEditingEnabled ? "greenTick" : "redTick"]} ${msg.gConfig.modlog.caseEditingEnabled ? "Enabled" : "Disabled"}`,
									`${config.emojis.default.dot} **Case Deleting**: ${config.emojis.custom[msg.gConfig.modlog.caseDeletingEnabled ? "greenTick" : "redTick"]} ${msg.gConfig.modlog.caseDeletingEnabled ? "Enabled" : "Disabled"}`,
									`${config.emojis.default.dot} **Edit Others Cases**: ${config.emojis.custom[msg.gConfig.modlog.editOthersCasesEnabled ? "greenTick" : "redTick"]} ${msg.gConfig.modlog.editOthersCasesEnabled ? "Enabled" : "Disabled"}`,
									"",
									// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
									`Webhook: **${wh.name}** (\`${wh.id}\`, [[avatar](${Object.getOwnPropertyDescriptor(Eris.User.prototype, "avatarURL")!.get!.call({ _client: this, id: wh.id, avatar: wh.avatar })})])`
								)
								.setColor("gold")
								.toJSON()
						]
					});
					break;
				}
				default: return new CommandError("INVALID_USAGE", cmd);
			}
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
