import ClientEvent from "@util/ClientEvent";
import CommandHandler from "@cmd/CommandHandler";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import config from "@config";
import { CategoryRestrictions } from "@cmd/Category";
import Logger from "@util/Logger";
import ComponentInteractionCollector, { Interaction } from "@util/ComponentInteractionCollector";
import { APIGuildMember,  APIMessageComponentInteractionData, GatewayDispatchEvents, GatewayGuildCreateDispatchData, GatewayInteractionCreateDispatchData, GatewayOpcodes, InteractionType } from "discord-api-types";
import Eris from "eris";
import { VoiceServerUpdate, VoiceStateUpdate } from "lavalink";
import StatsHandler from "@util/handlers/StatsHandler";
import EventsASecondHandler from "@util/handlers/EventsASecondHandler";

export default new ClientEvent("rawWS", async function({ op, d, t }) {
	EventsASecondHandler.add("general");
	const type = t as GatewayDispatchEvents | undefined;
	switch (op) {
		case GatewayOpcodes.Dispatch: {
			StatsHandler.trackNoResponse("stats", "events", type!);
			EventsASecondHandler.add(type!);
			switch (type) {
				case "VOICE_STATE_UPDATE": {
					if (!this.lava) return;
					void this.lava.voiceStateUpdate(d as VoiceStateUpdate);
					break;
				}

				case "VOICE_SERVER_UPDATE": {
					if (!this.lava) return;
					void this.lava.voiceServerUpdate(d as VoiceServerUpdate);
					break;
				}

				case "GUILD_CREATE": {
					if (!this.lava) return;
					const dd = d as GatewayGuildCreateDispatchData;
					for (const state of dd.voice_states!) void this.lava.voiceStateUpdate({ ...state, guild_id: dd.id } as VoiceStateUpdate);
					break;
				}

				case "INTERACTION_CREATE": {
					// Logger.getLogger("RawWS Event").info("Interaction Create Event:", d);
					const data = d as GatewayInteractionCreateDispatchData;
					switch (data.type) {
						case InteractionType.MessageComponent: {
							const cd = data.data as APIMessageComponentInteractionData;
							const { member } = (data as { member: APIGuildMember; });
							Logger.getLogger("BtnInteraction").info(`Recieved interaction from ${!member.user ? "Unknown" : `${member.user.username}#${member.user.discriminator} (${member.user.id})`}, interaction id: "${cd.custom_id}"`);
							const col = ComponentInteractionCollector.processInteraction(data as Interaction<APIMessageComponentInteractionData>);
							// skip if interaction was used
							if (col === true) return;
							const ch = this.getChannel(data.channel_id!) as Eris.GuildTextableChannel;
							if (cd.custom_id.startsWith("help")) {
								const [, name, user] = cd.custom_id.split(".");
								if (!user) {
									console.error(cd);
									throw new Error("help interaction without user");
								}
								// ignore if the button pusher isn't the original executor
								await this.createInteractionResponse(data.id, data.token, 6);
								if (user !== (data as { member: APIGuildMember; }).member.user?.id) {
									await this.createFollowupMessage(this.user.id, data.token, {
										content: "To navigate the help menu, please run the command yourself.",
										flags: 64
									});
									return;
								}
								if (name === "back") {
									// @ts-ignore missing types
									// eslint-disable-next-line
									const b = await Redis.get(`interactions:${data.message.id}:back`);
									let eb: { embeds: Array<Eris.EmbedOptions>; components: Eris.Message["components"]; } | undefined;
									try {
										eb = JSON.parse(b) as typeof eb;
									} catch (err) {
										// throw away error
									}
									if (eb === undefined) await this.editOriginalInteractionResponse(this.user.id, data.token, {
										content: "Failed to fetch original help menu, please run the command again.",
										embeds: [],
										components: []
									});
									await this.editOriginalInteractionResponse(this.user.id, data.token, {
										embeds: eb!.embeds,
										components: eb!.components
									});
									return;
								} else if (name === "home") {
									const e = new EmbedBuilder().setAuthor(`${member.user!.username}#${member.user!.discriminator}`, Object.getOwnPropertyDescriptor(Eris.User.prototype, "avatarURL")!.get!.call({ ...member.user, _client: this }));
									const c = new ComponentHelper();
									const hasUseExternal = ch.permissionsOf(this.user.id).has("useExternalEmojis");
									CommandHandler.categories.forEach((cat, i) => {
										if ((cat.restrictions.includes("beta") && !config.beta) || (cat.restrictions.includes("developer") && !config.developers.includes(member.user!.id))) return;
										e.addField(`${hasUseExternal && cat.displayName.emojiCustom ? `${cat.displayName.emojiCustom} ` : cat.displayName.emojiDefault ? `${cat.displayName.emojiDefault} ` : ""}${cat.displayName.text}`, `${cat.description || "No Description."}\nTotal Commands: **${cat.commands.length}**`, true);
										if ((i % 2) === 0) e.addBlankField(true);
										let emoji: Partial<Eris.PartialEmoji> | undefined;
										if (cat.displayName.emojiDefault !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiDefault, "default");
										if (hasUseExternal && cat.displayName.emojiCustom !== null) emoji = ComponentHelper.emojiToPartial(cat.displayName.emojiCustom, "custom");
										c.addInteractionButton(2, `help.${cat.name}.${user}`, (["disabled"] as Array<CategoryRestrictions>).some(v => cat.restrictions.includes(v)), emoji);
									});

									return this.editOriginalInteractionResponse(this.user.id, data.token, {
										embeds: [e.toJSON()],
										components: c.toJSON()
									});
								}
								const cat = CommandHandler.getCategory(name);
								if (cat === null) {
									await this.deleteOriginalInteractionResponse(this.user.id, data.token);
									return this.createFollowupMessage(this.user.id, data.token, {
										content: `Unknown Category "${name}" specified in recieved interaction **${cd.custom_id}**.`
									});
								} else {
									// @ts-ignore missing types
									// eslint-disable-next-line
									await Redis.set(`interactions:${data.message.id}:back`, JSON.stringify({ embeds: data.message.embeds, components: data.message.components }));
									const e = new EmbedBuilder()
										.setDescription(`Description: ${cat.description || "None"}\nTotal Commands: ${cat.commands.length}`)
										.setAuthor(`${member.user!.username}#${member.user!.discriminator}`, Object.getOwnPropertyDescriptor(Eris.User.prototype, "avatarURL")!.get!.call({ ...member.user, _client: this }));
									const cmdDesc = [] as Array<string>;
									const totalLen = cat.commands.reduce((a,b) => a + `\`${b.triggers[0]}\` - ${b.description}\n`.length, 0);
									cat.commands.forEach(cmd => {
										if (totalLen > 1900) cmdDesc.push(`\`${cmd.triggers[0]}\``);
										else cmdDesc.push(`\`${cmd.triggers[0]}\` - ${cmd.description || "No Description"}`);
									});
									e.setDescription(`${e.getDescription() ?? ""}\n\n${totalLen > 1900 ? cmdDesc.join(", ") : cmdDesc.join("\n")}`);
									return this.editOriginalInteractionResponse(this.user.id, data.token, {
										embeds: [e.toJSON()],
										components: new ComponentHelper()
											.addInteractionButton(2, `help.back.${user}`, false, ComponentHelper.emojiToPartial(config.emojis.default.back, "default"), "Back")
											.toJSON()
									});
								}
							} else {
								const [user] = cd.custom_id.split(".").slice(-1);
								if (/[\d]{15,21/.test(user) && user !== (data as { member: APIGuildMember; }).member.user?.id) {
									await this.createInteractionResponse(data.id, data.token, 6, {
										content: "H-hey! This isn't your button to click!",
										flags: 64
									});/*
									await this.createFollowupMessage(this.user.id, data.token, {
										content: "H-hey! This isn't your selection to make!",
										flags: 64
									}); */
									return;
								}
							}

							if (member.user) {
								if (cd.custom_id.startsWith("eval") && !config.developers.includes(member.user.id)) {
									await this.createInteractionResponse(data.id, data.token, 6);
									await this.createFollowupMessage(this.user.id, data.token, {
										content: "H-hey! You're not a developer, don't touch that!",
										flags: 64
									});
									return;
								}
								if (cd.custom_id === "eval.trash") {
									await this.createInteractionResponse(data.id, data.token, 6);
									// @ts-ignore missing types
									// eslint-disable-next-line
									await this.deleteMessage(ch.id, data.message.id);
								} else if (cd.custom_id.startsWith("eval.delete")) {
									const [,,id] = cd.custom_id.split(".");
									await this.createInteractionResponse(data.id, data.token, 6);
									await this.deleteMessage(ch.id, id);
								}
							}
						}
					}
				}
			}
		}
	}
});
