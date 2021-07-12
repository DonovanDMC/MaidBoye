import EmbedBuilder from "../../util/EmbedBuilder";
import MaidBoye from "@MaidBoye";
import Command from "@cmd/Command";
import config from "@config";
import CommandError from "@cmd/CommandError";
import ModLogUtil from "@util/ModLogUtil";
import ComponentHelper from "@util/ComponentHelper";
import ComponentInteractionCollector from "@util/ComponentInteractionCollector";
import GuildConfig from "@db/Models/GuildConfig";
import Eris, { InteractionCallbackType } from "eris";

export default new Command("modlog")
	.setPermissions("bot", "embedLinks", "manageChannels", "manageWebhooks")
	.setPermissions("user", "manageGuild")
	.setDescription("Manage this server's modlog")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		switch (msg.args[0]?.toLowerCase()) {
			case "setup": {
				const ch = (msg.args.length === 1 ? msg.channel : await msg.getChannelFromArgs(1, 0)) as Exclude<Eris.GuildTextableChannel, Eris.AnyThreadChannel> | null;
				if (ch === null) return msg.reply("Th-that isn't a valid channel..");
				const check = await ModLogUtil.check(msg.gConfig, this);
				if (check === true) return msg.reply(`Th-this server's modlog has already been set up.. if you want to reset it, run \`${msg.gConfig.getFormattedPrefix()}modlog reset\``);
				const m = await msg.reply({
					content: `Please select one of the following to proceed.\n1.) Select an existing webhook (on <#${ch.id}>) to use for the modlog\n2.) Provide a direct url to a webhook\n3.) Create a new webhook (with me)`,
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-1.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.one, "default"), "One")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-2.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.two, "default"), "Two")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-modlogsetup-3.${msg.author.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.three, "default"), "Three")
						.toJSON()
				});
				const sel = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 6e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("select-modlogsetup") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);
				if (sel === null) return m.edit({
					content: "Y-you took too long to respond..",
					components: []
				});
				await this.createInteractionResponse(sel.id, sel.token, InteractionCallbackType.UPDATE_MESSAGE, {
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
					const selC = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("modlogconfig") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);
					// defaults timeout
					if (selC === null) {
						await message.edit({
							content: "Detected timeout, using default configuration options. Setup complete!",
							components: []
						});
						return v;
					// defaults no
					} else if (selC.data.custom_id.indexOf("no") !== -1) {
						await this.createInteractionResponse(selC.id, selC.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Using default configuration options. Setup complete!",
							components: []
						});
						return v;
					} else if (selC.data.custom_id.indexOf("cancel") !== -1) {
						await this.createInteractionResponse(selC.id, selC.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Setup has been cancelled.",
							components: []
						});
						return null;
					}

					// ask case editing
					await this.createInteractionResponse(selC.id, selC.token, InteractionCallbackType.UPDATE_MESSAGE, {
						content: "Do you want to enable **Case Editing** after cases have been made? (default: **yes**)",
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `configCaseEditing-yes.${msg.author.id}`, false, undefined, "Yes")
							.addInteractionButton(ComponentHelper.BUTTON_DANGER, `configCaseEditing-no.${msg.author.id}`, false, undefined, "No")
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `configCaseEditing-exit.${msg.author.id}`, false, undefined, "Exit")
							.toJSON()
					});
					// case editing collector
					const cnfCaseEditing = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("configCaseEditing") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);

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
						await this.createInteractionResponse(cnfCaseEditing.id, cnfCaseEditing.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: `**Case Editing** has been set to disabled.\n\nNext: Do you want to enable **Case Deletion**? (default: **${v.caseDeletingEnabled ? "yes" : "no"}**)`,
							components: cnfCDComponents
						});
						v.caseEditingEnabled = false;
					// case editing yes
					} else if (cnfCaseEditing.data.custom_id.indexOf("yes") !== -1) {
						await this.createInteractionResponse(cnfCaseEditing.id, cnfCaseEditing.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: `**Case Editing** has been set to enabled.\n\nNext: Do you want to enable **Case Deletion**? (default: **${v.caseDeletingEnabled ? "yes" : "no"}**)**)`,
							components: cnfCDComponents
						});
						v.caseEditingEnabled = true;
					// case editing exit
					} else if (cnfCaseEditing.data.custom_id.indexOf("exit") !== -1) {
						await this.createInteractionResponse(cnfCaseEditing.id, cnfCaseEditing.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Exiting.",
							components: []
						});
						return v;
					}
					// case deletion collector
					const cnfCaseDeletion = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("configCaseDeletion") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);

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
						await this.createInteractionResponse(cnfCaseDeletion.id, cnfCaseDeletion.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: `**Case Deletion** has been set to disabled.\n\nNext: Do you want to enable **Editing Others Cases**? (default: **${v.editOthersCasesEnabled ? "yes" : "no"}**)`,
							components: cnfEOCComponents
						});
						v.caseDeletingEnabled = false;
					// case deletion yes
					} else if (cnfCaseDeletion.data.custom_id.indexOf("yes") !== -1) {
						await this.createInteractionResponse(cnfCaseDeletion.id, cnfCaseDeletion.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: `**Case Deletion** has been set to enabled.\n\nNext: Do you want to enable **Editing Others Cases**? (default: **${v.editOthersCasesEnabled ? "yes" : "no"}**)`,
							components: cnfEOCComponents
						});
						v.caseDeletingEnabled = true;
					// case deletion exit
					} else if (cnfCaseDeletion.data.custom_id.indexOf("exit") !== -1) {
						await this.createInteractionResponse(cnfCaseDeletion.id, cnfCaseDeletion.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Exiting.",
							components: []
						});
						return v;
					}
					// edit others cases collector
					const cnfEditOthersCases = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 3e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("configEditOthersCases") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);

					// edit others cases timeout
					if (cnfEditOthersCases === null) await message.edit({
						content: `Detected timeout, using default value for **Edit Others Cases** (${v.editOthersCasesEnabled ? "yes" : "no"}).\n\nSetup is complete.`,
						components: []
					});
					// edit others cases no
					else if (cnfEditOthersCases.data.custom_id.indexOf("no") !== -1) {
						await this.createInteractionResponse(cnfEditOthersCases.id, cnfEditOthersCases.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "**Edit Others Cases** has been set to disabled.\n\nSetup is complete.",
							components: []
						});
						v.editOthersCasesEnabled = false;
					// edit others cases yes
					} else if (cnfEditOthersCases.data.custom_id.indexOf("yes") !== -1) {
						await this.createInteractionResponse(cnfEditOthersCases.id, cnfEditOthersCases.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "**Edit Others Cases** has been set to enabled.\n\nSetup is complete.",
							components: []
						});
						v.editOthersCasesEnabled = true;
					// edit others cases exit
					} else if (cnfEditOthersCases.data.custom_id.indexOf("exit") !== -1) {
						await this.createInteractionResponse(cnfEditOthersCases.id, cnfEditOthersCases.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Exiting.",
							components: []
						});
						return v;
					}

					return v;
				}

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
						await m.edit({
							content: "Please select a webhook from the following.\n(if the button is disabled, we couldn't get all of the info we needed about the webhook)",
							components: c.toJSON()
						});
						const selW = await ComponentInteractionCollector.awaitInteractions(msg.channel.id, 6e4, (it) => it.channel_id === msg.channel.id && it.data.custom_id.startsWith("select-webhook") && it.data.custom_id.endsWith(msg.author.id) && !!it.member.user && it.member.user.id === msg.author.id);
						if (selW === null) return m.edit({
							content: "Y-you took too long to respond..",
							components: []
						});
						const hook = hooks[Number(selW.data.custom_id.split(".")[0].split("-")[2])];
						if (!hook) return this.createInteractionResponse(selW.id, selW.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: "Internal error.",
							components: []
						});
						await this.createInteractionResponse(selW.id, selW.token, InteractionCallbackType.UPDATE_MESSAGE, {
							content: `Successfully selected the webhook **${hook.name}** (${hook.id})\nWould you like to configure the more detailed options, or leave them at their defaults?`,
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `modlogconfig-yes.${msg.author.id}`, false, undefined, "Configure")
								.addInteractionButton(ComponentHelper.BUTTON_DANGER, `modlogconfig-no.${msg.author.id}`, false, undefined, "Defaults")
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `modlogconfig-cancel.${msg.author.id}`, false, undefined, "Cancel")
								.toJSON()
						});
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

					// provide url
					case 2: {
						break;
					}

					// create
					case 3: {
						break;
					}

					default: return msg.channel.createMessage("There was an internal error..");
				}
				break;
			}
			default: return new CommandError("INVALID_USAGE", cmd);
		}
	});
