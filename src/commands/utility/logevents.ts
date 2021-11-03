import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/components/ComponentHelper";
import type MaidBoye from "@MaidBoye";
import { botIcon, emojis, logEvents, names } from "@config";
import Eris, { DiscordRESTError } from "eris";
import BotFunctions from "@util/BotFunctions";
import { Request, Strings } from "@uwu-codes/utils";
import FileType from "file-type";
import ErrorHandler from "@handlers/ErrorHandler";
import LogEvent from "@models/Guild/LogEvent";
import chunk from "chunk";

export default new Command("logevents", "logging")
	.setPermissions("bot", "embedLinks", "useExternalEmojis")
	.setPermissions("user", "manageGuild")
	.setDescription("Manage the logging for this server")
	.setCooldown(3e3)
	.setRestrictions("beta")
	.setExecutor(async function(msg) {
		try {
			let m: Eris.Message;
			if (msg.args.length === 0) {
				m = await msg.reply({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("Please Select an option from below.")
							.setColor("gold")
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logevents-add.${msg.author.id}`, false, undefined, "Add")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logevents-remove.${msg.author.id}`, false, undefined, "Remove")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logevents-list.${msg.author.id}`, false, undefined, "List")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logevents-clear.${msg.author.id}`, false, undefined, "Clear")
						.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logevents-cancel.${msg.author.id}`, false, undefined, "Cancel")
						.toJSON()
				});
				const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && !!it.member && it.member.id === msg.author.id && it.data.custom_id.startsWith("logevents-"));
				if (wait === null) return m.replaceContent({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("You took too long to respond.")
							.setColor("red")
							.toJSON()
					]
				});
				else {
					await wait.acknowledge();
					if (wait.data.custom_id.includes("add")) void addEntry.call(this);
					else if (wait.data.custom_id.includes("remove")) void removeEntry.call(this);
					else if (wait.data.custom_id.includes("list")) void listEntries.call(this);
					else if (wait.data.custom_id.includes("clear")) void clearEntries.call(this);
					else return m.replaceContent({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("Cancelled.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
				}
			} else {
				m = await msg.reply("Warming up..");
				if (msg.args[0].toLowerCase() === "add") void addEntry.call(this);
				else if (msg.args[0].toLowerCase() === "remove") void removeEntry.call(this);
				else if (msg.args[0].toLowerCase() === "list") void listEntries.call(this);
				else if (msg.args[0].toLowerCase() === "clear") void clearEntries.call(this);
				else return msg.reply("H-hey! That wasn't a valid sub command.. Try `add`, `remove`, `list`, or `clear`.");
			}

			async function addEntry(this: MaidBoye) {
				let total = msg.gConfig.logEvents.length;
				const hasAll = msg.gConfig.logEvents.find(l => l.event === "all") !== undefined;
				if (hasAll) total += LogEvent.EVENTS.length - 1;
				if (total >= LogEvent.MAX_EVENTS) return m.replaceContent(
					`H-hey! This server already has the maximum amount of logging enabled.. Remove some to add more.\n\n(Note: **All** counts as \`${LogEvent.EVENTS.length - 1}\` entries)`
				);
				const h = new ComponentHelper(4);
				logEvents.forEach((cat, i) => h.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-cat${i}.${msg.author.id}`, false, ComponentHelper.emojiToPartial(cat.emoji, "custom")));
				await m.replaceContent({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription([
								"Please select an event category.",
								"(all is under misc)",
								"",
								"Key:",
								...logEvents.map(c => `${c.emoji}: **${c.name}** - ${c.events.length} event${c.events.length !== 1 ? "s" : ""}`)
							])
							.setColor("green")
							.toJSON()
					],
					components: h
						.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsadd-cancel.${msg.author.id}`, false, undefined, "Cancel")
						.toJSON()
				});
				const selCat = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
				if (selCat === null || selCat.data.custom_id.includes("cancel")) {
					if (selCat) await selCat.acknowledge();
					return m.replaceContent("Canceled.");
				}
				await selCat.acknowledge();
				const ct = logEvents[Number(selCat.data.custom_id.split(".")[0].slice(-1))];
				if (!ct) return m.replaceContent("An internal error occured.");

				await m.replaceContent({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle(`Category: ${ct.name}`)
							.setDescription("Please select an event type from below.")
							.setColor("green")
							.toJSON()
					],
					components: new ComponentHelper()
						.addSelectMenu(`logeventsadd-select.${msg.author.id}`, ct.events.map(v => ({ label: v.name, value: v.value, description: v.description })))
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-back.${msg.author.id}`, false, undefined, "Back")
						.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsadd-cancel.${msg.author.id}`, false, undefined, "Cancel")
						.toJSON()
				});
				const evt = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
				if (evt === null) return m.replaceContent({
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setDescription("You took too long to respond.")
							.setColor("red")
							.toJSON()
					]
				});
				else {
					await evt.acknowledge();
					if (evt.data.custom_id.includes("select")) {
						if (evt.data.component_type !== Eris.Constants.ComponentTypes.SELECT_MENU) return;
						const event = evt.data.values[0] as typeof LogEvent["EVENTS"][number];
						// I hate this
						const { name } = ct.events.find(v => v.value === event)!;
						const { length: currentLen } = msg.gConfig.logEvents.filter(ev => ev.event === event);

						if (event === "all" && currentLen >= 1) return m.replaceContent(
							"H-hey! You can only have 1 **All** enabled at a time.. Remove some to add more."
						);
						else if (currentLen >= 3) return m.replaceContent(
							`H-hey! You already have 3 of the **${name}** type.. Remove some to add more.`
						);

						await m.replaceContent({
							embeds: [
								new EmbedBuilder(true, msg.author)
									.setTitle("Channel To use")
									.setDescription("Please select an option.")
									.toJSON()
							],
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-current.${msg.author.id}`, false, undefined, "Current Channel")
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-other.${msg.author.id}`, false, undefined, "Other Channel")
								.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsadd-cancel.${msg.author.id}`, false, undefined, "Cancel")
								.toJSON()
						});
						let ch: Eris.GuildTextableChannel | null = null;
						const selC = await msg.channel.awaitComponentInteractions(3e4, (it) => it.message.id === m.id && !!it.member && it.member.id === msg.author.id);
						if (selC === null) return m.replaceContent({
							embeds: [
								new EmbedBuilder(true, msg.author)
									.setDescription("You took too long to respond.")
									.setColor("red")
									.toJSON()
							]
						});
						else {
							await selC.acknowledge();
							if (selC.data.custom_id.includes("current")) ch = msg.channel;
							else if (selC.data.custom_id.includes("other")) {
								const j = await msg.channel.awaitMessages(3e4, (mg) => mg.author.id === msg.author.id);
								if (j === null) return m.replaceContent({
									embeds: [
										new EmbedBuilder(true, msg.author)
											.setDescription("You took too long to respond.")
											.setColor("red")
											.toJSON()
									]
								});
								if (j && msg.channel.permissionsOf(this.user.id).has("manageMessages")) await j.delete().catch(() => null);
							} else return m.replaceContent({
								embeds: [
									new EmbedBuilder(true, msg.author)
										.setDescription("Canceled.")
										.setColor("red")
										.toJSON()
								]
							});
						}
						if (ch === null) return msg.reply(BotFunctions.replaceContent(
							"Th-that wasn't a valid channel!"
						));

						const inChannel = msg.gConfig.logEvents.filter(l => l.webhook.channel === ch!.id && l.event === event);
						for (const inCh of inChannel) {
							const hk = await this.getWebhook(inCh.webhook.id, inCh.webhook.token).catch(() => null);
							if (hk === null || (hk.channel_id && hk.channel_id !== ch.id)) {
								await inCh.delete();
								inChannel.splice(inChannel.indexOf(inCh), 1);
							}
						}
						if (inChannel.find(v => v.event === "all")) return m.replaceContent(
							`H-hey! **All** is enabled in <#${ch.id}>.. Remove that before adding anything else.`
						);
						if (inChannel.length) return m.replaceContent(
							`H-hey! Logging of **${name}** is already enabled in <#${ch.id}>.. Remove that one to add a new one..`
						);

						await m.replaceContent({
							content: `Please select one of the following to proceed.\n1.) Select an existing webhook (on <#${ch.id}>) to use for logging\n2.) Provide a direct url to a webhook\n3.) Create a new webhook (with me)`,
							components: new ComponentHelper()
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-1.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.one, "default"), "One")
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-2.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.two, "default"), "Two")
								.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsadd-3.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.three, "default"), "Three")
								.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsadd-cancel.${msg.author.id}`, false, undefined, "Cancel")
								.toJSON()
						});
						const sel = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
						if (sel === null || sel.data.custom_id.includes("cancel")) {
							if (sel) await sel.acknowledge();
							return m.replaceContent(
								"Canceled."
							);
						}
						await sel.acknowledge();
						let hook: Eris.Webhook;

						switch (Number(sel.data.custom_id.split(".")[0].split("-")[1])) {
							// select
							case 1: {
								const hooks = await ch.getWebhooks();
								if (hooks.length === 0) return m.replaceContent(
									"Th-that channel doesn't have any webhooks to use.."
								);
								const c = new ComponentHelper(3);
								let i = 0;
								for (const w of hooks) {
									i++;
									c.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `select-webhook-${i - 1}.${msg.author.id}`, !w.token, ComponentHelper.emojiToPartial(emojis.default[names.number[i as unknown as "0"] as "zero"], "default"), w?.name || "Unknown");
								}

								// we somehow end up with no usable components
								if (c.toJSON().length === 0 || c.toJSON()[0].components.length === 0) return m.replaceContent("Th-that channel doesn't have any webhooks to use..");
								await m.replaceContent({
									content: "Please select a webhook from the following.\n(if the button is disabled, we couldn't get all of the info we needed about the webhook)",
									components: c
										.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsadd-cancel.${msg.author.id}`, false, undefined, "Cancel")
										.toJSON()
								});
								const selW = await msg.channel.awaitComponentInteractions(6e4, (it) => it.channel.id === msg.channel.id && it.message.id === m.id && it.data.custom_id.startsWith("select-webhook") && it.data.custom_id.endsWith(msg.author.id) &&  it.member!.user.id === msg.author.id);
								if (selW === null || selW.data.custom_id.includes("cancel")) {
									if (selW) await selW.acknowledge();
									return m.replaceContent(
										"Canceled."
									);
								}
								hook = hooks[Number(selW.data.custom_id.split(".")[0].split("-")[2])];
								break;
							}

							// provide url
							case 2: {
								const hooks = await msg.channel.guild.getWebhooks();
								if (hooks.length === 0) return m.replaceContent(
									"Th-This server doesn't have any webhooks to use.."
								);
								await m.replaceContent(
									"Please provide a full webhook url."
								);
								const wt = await msg.channel.awaitMessages(6e4, ({ author: { id } }) => id === msg.author.id, 1);
								if (wt === null) return m.replaceContent(
									"Y-you took too long to respond.."
								);
								if (wt.content.toLowerCase() === "cancel") return m.replaceContent(
									"Cancelled."
								);
								const [ , id, token] = (/https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/(\d{15,21})\/([a-zA-Z\d_-]+)/.exec(wt.content) ?? [] as unknown) as  [_: never, id?: string, token?: string];
								if (!id || !token) return m.replaceContent(
									"The provided webhook url is not valid."
								);
								const w = hooks.find(v => v.id === id && v.token === v.token);
								if (w === undefined) return m.replaceContent(
									"The webhook you provided is either invalid, or not a part of this server."
								);
								hook = w;
								break;
							}

							// create
							case 3: {
								if (!ch.permissionsOf(this.user.id).has("manageWebhooks")) return m.replaceContent(
									"I-I'm missing the **Manage Webhooks** permission.."
								);
								const hooks = await ch.getWebhooks();
								if (hooks.length >= 10) return m.replaceContent(
									"H-hey! This channel already has too many webooks.. Delete some to make a new one."
								);
								const img = await Request.getImageFromURL(botIcon);
								const { mime } = await FileType.fromBuffer(img) ?? { mime: null };
								if (mime === null) throw new Error("Internal error.");
								const b64 = Buffer.from(img).toString("base64");
								try {
									hook = await ch.createWebhook({
										name: "Maid Boye Logging",
										avatar: `data:${mime};base64,${b64}`
									});
								} catch (err) {
									if (err instanceof Error) await m.replaceContent(
										`Something broke..\n\`\`\`\n${err.name}: ${err.message}\`\`\``
									);
									throw err;
								}
								break;
							}

							default: return msg.channel.createMessage("There was an internal error..");
						}

						if (!hook || !hook.token) return m.replaceContent(
							"A webhook could not be determined."
						);

						await msg.gConfig.addLogEvent(event, hook.id, hook.token, ch.id);

						if (event === "all") {
							for (const log of msg.gConfig.logEvents) {
								if (log.webhook.channel !== ch.id || log.event === "all") continue;
								else await log.delete();
							}
						}

						await m.replaceContent(
							`Successfully enabled logging of \`${name}\` via **${hook.name}** (${hook.id}) in <#${ch.id}>`
						);
					} else if (evt.data.custom_id.includes("back")) {
						void addEntry.call(this);
						return;
					} else return m.replaceContent({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("Cancelled.")
								.setColor("red")
								.toJSON()
						]
					});
				}
			}

			async function removeEntry(this: MaidBoye) {
				const list = chunk(msg.gConfig.logEvents, 10);
				if (list.length === 0) return m.replaceContent(
					"There are no logging entries to remove."
				);
				async function setPage(this: MaidBoye, page: number) {
					await m.replaceContent({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription("Please select one to remove.")
								.setColor("gold")
								.toJSON()
						],
						components: new ComponentHelper()
							.addSelectMenu(`logeventsremove-select.${msg.author.id}`, list[page].map(ev => {
								const cat = logEvents.find(l => l.events.find(d => d.value === ev.event))!;
								const { name, description } = cat.events.find(e => e.value === ev.event)!;
								const ch = msg.channel.guild.channels.get(ev.webhook.channel);
								return {
									label: `${name} in ${ch === undefined ? ev.webhook.channel : Strings.truncate(`#${ch.name}`, 75)}`,
									value: `${ev.event}-${ev.webhook.channel}`,
									description,
									emoji: ComponentHelper.emojiToPartial(cat.emoji, "custom")
								};
							}))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsremove-back.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.back, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsremove-stop.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventsremove-next.${msg.author.id}`, (page + 1) === list.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"))
							.toJSON()
					});

					const wait = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
					if (wait === null || wait.data.custom_id.includes("stop")) {
						if (wait) await wait.acknowledge();
						// this is meant to be edit, do not change it
						return m.edit({ components: [] });
					} else {
						await wait.acknowledge();
						if (wait.data.custom_id.includes("back")) void setPage.call(this, page - 1);
						else if (wait.data.custom_id.includes("next")) void setPage.call(this, page + 1);
						else if (wait.data.custom_id.includes("select")) {
							if (!("values" in wait.data)) return;
							const [event, channel] = wait.data.values[0].split("-");
							if (!event || !channel) return m.replaceContent(
								"Something broke."
							);
							const ev = msg.gConfig.logEvents.find(l => l.event === event && l.webhook.channel === channel);
							const rm = await msg.gConfig.removeLogEvent(event, channel);
							const { name } = logEvents.find(l => l.events.find(d => d.value === event))!.events.find(e => e.value === event)!;
							if (rm === false) return m.replaceContent(`Failed to disable logging of **${name}** in <#${channel}>.`);
							if (ev) {
								const otherEvents = msg.gConfig.logEvents.filter(l => l.webhook.id === ev.webhook.id && l.webhook.token === ev.webhook.token);
								otherEvents.splice(otherEvents.indexOf(ev), 1);
								const hook = await this.getWebhook(ev.webhook.id, ev.webhook.token).catch(() => null);
								if (hook !== null) {
									await m.replaceContent({
										content: `This entry seems to be the last one using the webhook **${hook.name}** (${hook.id}), do you want to delete this webhook as well?`,
										components: new ComponentHelper()
											.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `logeventsremove-yes.${msg.author.id}`, false, undefined, "Yes")
											.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsremove-no.${msg.author.id}`, false, undefined, "No")
											.toJSON()
									});
									const v = await msg.channel.awaitComponentInteractionsGeneric(3e4, m.id, msg.author.id);
									if (v === null || v.data.custom_id.includes("no")) return m.replaceContent(`Disabled logging of **${name}** in <#${channel}>.\nWebhook was not deleted.`);
									else {
										let err: Error | undefined;
										try {
											await this.deleteWebhook(hook.id, hook.token);
										} catch (e) { err = e as Error; }

										return m.replaceContent(`Disabled logging of **${name}** in <#${channel}>.\n${err === undefined ? "Webhook deleted successfully." : `Error deleting webhook: \`${err.name}: ${err.message}\``}`);
									}
								} else for (const other of otherEvents) await other.delete();
							}
							if (rm === true) return m.replaceContent(`Disabled logging of **${name}** in <#${channel}>.`);
							else return m.replaceContent(`Failed to disable logging of **${name}** in <#${channel}>.`);
						}
					}
				}

				void setPage.call(this, 0);
			}

			async function listEntries(this: MaidBoye) {
				const list = chunk(msg.gConfig.logEvents, 10);
				if (list.length === 0) return m.replaceContent(
					"There are no logging entries to list."
				);
				async function setPage(this: MaidBoye, page: number) {
					await m.replaceContent({
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setDescription(list[page].map(ev => `**${logEvents.find(l => l.events.find(d => d.value === ev.event))!.events.find(d => d.value === ev.event)!.name}** - <#${ev.webhook.channel}>`))
								.setColor("gold")
								.toJSON()
						],
						components: new ComponentHelper()
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventslist-back.${msg.author.id}`, page === 0, ComponentHelper.emojiToPartial(emojis.default.back, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventslist-stop.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"))
							.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `logeventslist-next.${msg.author.id}`, (page + 1) === list.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"))
							.toJSON()
					});

					const wait = await msg.channel.awaitComponentInteractions(6e4, (it) => it.message.id === m.id && !!it.member && it.member.id === msg.author.id);
					if (wait === null || wait.data.custom_id.includes("stop")) {
						if (wait) await wait.acknowledge();
						return m.edit({ components: [] });
					} else {
						await wait.acknowledge();
						if (wait.data.custom_id.includes("back")) void setPage.call(this, page - 1);
						else if (wait.data.custom_id.includes("next")) void setPage.call(this, page + 1);
					}
				}

				void setPage.call(this, 0);
			}

			async function clearEntries(this: MaidBoye) {
				if (msg.gConfig.logEvents.length === 0) return m.replaceContent("There are no logging entries to clear.");
				await m.replaceContent({
					content: `Are you sure you want to disable **${msg.gConfig.logEvents.length}** logging entr${msg.gConfig.logEvents.length === 1 ? "y" : "ies"}?`,
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `logeventsclear-yes.${msg.author.id}`, false, undefined, "Yes")
						.addInteractionButton(ComponentHelper.BUTTON_DANGER, `logeventsclear-no.${msg.author.id}`, false, undefined, "No")
						.toJSON()
				});
				const c = await msg.channel.awaitComponentInteractionsGeneric(6e4, m.id, msg.author.id);
				if (c === null || c.data.custom_id.includes("no")) {
					if (c) await c.acknowledge();
					return m.replaceContent({
						content: "Canceled."
					});
				} else {
					await c.acknowledge();
					// I know this should be all we get, but we need to make sure
					if (c.data.custom_id.includes("yes")) {
						await msg.gConfig.resetLogEvents();
						return m.replaceContent("All logging entries have been disabled.");
					}
				}
			}
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
