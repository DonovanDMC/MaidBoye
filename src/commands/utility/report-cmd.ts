import Command/* , { Permissions } */ from "@cmd/Command";
/* import MessageCollector from "@util/MessageCollector";
import EmbedBuilder from "@util/EmbedBuilder";
import ExtendedMessage from "@util/ExtendedMessage";
import MaidBoye from "../../main";
import config from "@config";
import Eris from "eris"; */

export default new Command("report")
	.setPermissions("bot", "manageMessages", "manageChannels")
	.setDescription("Report a user")
	.setUsage("(run with no arguments)")
	.setRestrictions("developer")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		return msg.reply("This feature is currently in development.");
		/* if (msg.channel.name.toLowerCase().startsWith("user-report-")) {
			const [, id] = /^user-report-([a-z\d]+)$/i.exec(msg.channel.name) ?? [];
			if (!id) return msg.reply("This channel doesn't seem to be a valid report channel..");
			const r = await msg.gConfig.getReport(id);
			if (r === null) return msg.reply("I couldn't find the report associated with this channel.");
			if (msg.channel.id !== r.channel) return msg.reply("This channel is not the original report channel.");
			switch (msg.args[0].toLowerCase()) {
				case "setreason": {
					if (msg.author.id !== r.reportedBy) return msg.reply("You are not the creator of this report, so you cannot edit the reason.");
					const reason = msg.args.slice(1).join(" ");
					if (reason.length > 1250) return msg.reply("The reason you provided is too long. Keep it under 1250 characters.");
					await r.edit(reason);
					const u = await this.getUser(r.reportedUser);
					await msg.channel.edit({
						topic: `Reported User: <@!${r.reportedUser}> (${u?.tag || "Unknown#0000"})`
					}, "");
					return msg.reply("The reason has been updated.");
					break;
				}
			}
		} else {
		// @TODO config command
			if (msg.gConfig.reports.enabled !== true) return msg.reply(`H-hey! Reports aren't enabled here.. Please ask a server administrator to enable them via \`${msg.gConfig.getFormattedPrefix(0)} config reports\``);
			switch (msg.gConfig.reports.type) {
				case "channel": {
					if (msg.gConfig.reports.category === null) return msg.reply("H-hey! Reports seem to be misconfigured.. Please ask a server administrator to set the reports category.");
					if (msg.gConfig.reports.staffRole === null) return msg.reply("H-hey! Reports seem to be misconfigured.. Please ask a server administrator to set the staff role.");
					if (!msg.channel.guild.roles.has(msg.gConfig.reports.staffRole)) return msg.reply("H-hey! Reports seem to be misconfigured.. Please ask a server administrator to reconfigure the staff role. (issue: staff role does not exist");
					const cat = msg.channel.guild.channels.get(msg.gConfig.reports.category) as Eris.CategoryChannel;
					if (!cat) return msg.reply("H-hey! Reports seem to be misconfigured.. Please ask a server administrator to reconfigure the reports category. (issue: channel does not exist)");
					if (cat.type !== Eris.Constants.ChannelTypes.GUILD_CATEGORY) return msg.reply("H-hey! Reports seem to be misconfigured.. Please ask a server administrator to reconfigure the reports category. (issue: channel is not a category)");
					const ch = await this.createChannel(msg.channel.guild.id, "user-report-new", Eris.Constants.ChannelTypes.GUILD_TEXT, {
						parentID: cat.id,
						permissionOverwrites: [
							{
								type: 0,
								id: msg.channel.guild.id, // @everyone
								allow: 0n,
								deny: Eris.Constants.Permissions.viewChannel
							},
							{
								type: 0,
								id: msg.gConfig.reports.staffRole,
								allow:
								Eris.Constants.Permissions.manageChannels |
								Eris.Constants.Permissions.viewChannel |
								Eris.Constants.Permissions.sendMessages |
								Eris.Constants.Permissions.embedLinks |
								Eris.Constants.Permissions.attachFiles |
								Eris.Constants.Permissions.readMessageHistory,
								deny: 0n
							},
							{
								type: 1,
								id: msg.author.id,
								allow:
								Eris.Constants.Permissions.sendMessages |
								Eris.Constants.Permissions.viewChannel |
								Eris.Constants.Permissions.embedLinks |
								Eris.Constants.Permissions.attachFiles |
								Eris.Constants.Permissions.readMessageHistory |
								Eris.Constants.Permissions.useExternalEmojis,
								deny:
								Eris.Constants.Permissions.createInstantInvite |
								Eris.Constants.Permissions.useSlashCommands |
								Eris.Constants.Permissions.usePublicThreads |
								Eris.Constants.Permissions.usePrivateThreads
							},
							{
								type: 1,
								id: this.user.id,
								allow:
								Eris.Constants.Permissions.manageChannels |
								Eris.Constants.Permissions.sendMessages |
								Eris.Constants.Permissions.viewChannel |
								Eris.Constants.Permissions.manageMessages |
								Eris.Constants.Permissions.embedLinks |
								Eris.Constants.Permissions.attachFiles |
								Eris.Constants.Permissions.readMessageHistory |
								Eris.Constants.Permissions.useExternalEmojis,
								deny: 0n
							}
						],
						reason: `Report By ${msg.author.tag} (${msg.author.id})`
					});
					const m = await ch.createMessage(`<@!${msg.author.id}> Please send either the username (and discriminator, if their username is not unique), or id of the person you are reporting.`);
					try {
						await msg.delete();
					} catch (e) {
						await msg.reply({
							content: `<#${ch.id}>`,
							allowedMentions: {
								repliedUser: true
							}
						});
					}

					// eslint-disable-next-line no-inner-declarations
					async function getUser(this: MaidBoye): Promise<Eris.User | null> {
						const userMsgRaw = await MessageCollector.awaitMessages(ch.id, 3e4, (mf) => mf.author.id === msg.author.id);
						if (userMsgRaw === null) {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("Report Timeout")
										.setColor("red")
										.setDescription("Report timed out. This channel will be deleted in 30 seconds.")
										.toJSON()
								]
							});
							setTimeout(() => ch.delete("Report Timeout").catch(() => ch.createMessage("Failed to delete channel. Please contact a server administrator to clean up this thread.")), 3e4);
							return null;
						} else if (userMsgRaw.content.toLowerCase() === "cancel") {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("Report Cancelled")
										.setColor("red")
										.setDescription("Report cancelled. This channel will be deleted in 30 seconds.")
										.toJSON()
								]
							});
							setTimeout(() => ch.delete("Report Timeout").catch(() => ch.createMessage("Failed to delete channel. Please contact a server administrator to clean up this thread.")), 3e4);
							return null;
						}
						const userMsg = new ExtendedMessage(userMsgRaw, this);
						await userMsg.load();
						await userMsgRaw.delete().catch(() => null);

						const user = await userMsg.getUserFromArgs();

						if (user === null) {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setTitle("Invalid User")
										.setColor("red")
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setDescription("We couldn't find a user with what you provided.. Please try again, or provide `cancel` to cancel.")
										.toJSON()
								]
							});
							return getUser.call(this);
						} else {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("User Confirmation")
										.setColor("gold")
										.setDescription(
											"Is this the user you are reporting?",
											"Answer **yes** or **no**.",
											"",
											`User: <@!${user.id}> (\`${user.tag}\`)`,
											`ID: \`${user.id}\``
										)
										.setImage(user.avatarURL)
										.toJSON()
								]
							});

							const confirmMsg = await MessageCollector.awaitMessages(ch.id, 3e4, (mf) => mf.author.id === msg.author.id);
							if (confirmMsg === null) {
								await m.edit({
									content: "",
									embeds: [
										new EmbedBuilder()
											.setAuthor(msg.author.tag, msg.author.avatarURL)
											.setTitle("Report Timeout")
											.setColor("red")
											.setDescription("Report timed out. This channel will be deleted in 30 seconds.")
											.toJSON()
									]
								});
								setTimeout(() => ch.delete("Report Timeout").catch(() => ch.createMessage("Failed to delete channel. Please contact a server administrator to clean up this thread.")), 3e4);
								return null;
							} else {
								await confirmMsg.delete().catch(() => null);
								if (confirmMsg.content.toLowerCase() !== "yes") {
									await m.edit({
										content: "",
										embeds: [
											new EmbedBuilder()
												.setAuthor(msg.author.tag, msg.author.avatarURL)
												.setTitle("Report Cancelled")
												.setColor("red")
												.setDescription("Report cancelled. This channel will be deleted in 30 seconds.")
												.toJSON()
										]
									});
									setTimeout(() => ch.delete("Report Timeout").catch(() => ch.createMessage("Failed to delete channel. Please contact a server administrator to clean up this thread.")), 3e4);
									return null;
								} else return user;
							}
						}
					}

					const user = await getUser.call(this);
					if (user === null) return;

					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder()
								.setAuthor(msg.author.tag, msg.author.avatarURL)
								.setTitle("Report Reason")
								.setColor("gold")
								.setDescription("Got it. Please provide a reason for the report.")
								.setFooter(`Reported User: ${user.tag}`, user.avatarURL)
								.toJSON()
						]
					});
					const reasonMsg = await MessageCollector.awaitMessages(ch.id, 3e4, (mf) => mf.author.id === msg.author.id);
					if (reasonMsg === null) {
						await m.edit({
							content: "",
							embeds: [
								new EmbedBuilder()
									.setAuthor(msg.author.tag, msg.author.avatarURL)
									.setTitle("Report Timeout")
									.setColor("red")
									.setDescription("Report timed out. This channel will be deleted in 30 seconds.")
									.toJSON()
							]
						});
						setTimeout(() => ch.delete("Report Timeout").catch(() => ch.createMessage("Failed to delete thread. Please contact a server administrator to clean up this thread.")), 3e4);
						return null;
					} else {
						await reasonMsg.delete().catch(() => null);
						const r = await msg.gConfig.createReport(msg.author.id, user.id, ch.id, "channel", reasonMsg.content);

						await m.edit({
							content: "",
							embeds: [
								new EmbedBuilder()
									.setAuthor(msg.author.tag, msg.author.avatarURL)
									.setTitle("Report Complete")
									.setColor("gold")
									.setDescription(
										"Your report is finished, and has been sent to this server's staff. If they do not reply within 24 hours, this report will be automatically closed.",
										"",
										`Report Id: \`${r}\``,
										`User Reported: <@!${user.id}> (${user.tag})`
									)
									.toJSON()
							]
						});
						await ch.edit({
							name: `user-report-${r}`
						});
					}
					break;
				}

				case "threads": {
					if (!msg.channel.guild.features.includes("PRIVATE_THREADS")) return msg.reply("This server cannot use this reports type as it does not have access to private threads. Please contact a server administrator to change this.");
					const perm = ["usePrivateThreads", "manageThreads"] as Array<Permissions>;
					for (const p of perm) if (!msg.channel.guild.me.permissions.has(p)) return msg.reply(`I must have the **${config.permissions[p] ?? p}** permission to run this. If this server does not have access to threads, this command cannot be used. Please contact a server administrator to correct this.`);
					const t = await this.createThreadWithoutMessage(msg.channel.id, {
						type: Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD,
						autoArchiveDuration: 1440,
						name: "New User Report"
					});
					await t.join(msg.author.id);

					try {
						await msg.delete();
					} catch (e) {
						await msg.reply({
							content: `<#${t.id}>`,
							allowedMentions: {
								repliedUser: true
							}
						});
					}

					const m = await t.createMessage(`<@!${msg.author.id}> Please send either the username (and discriminator, if their username is not unique), or id of the person you are reporting.`);

					// eslint-disable-next-line no-inner-declarations
					async function getUser(this: MaidBoye): Promise<Eris.User | null> {
						const userMsgRaw = await MessageCollector.awaitMessages(t.id, 3e4, (mf) => mf.author.id === msg.author.id);
						if (userMsgRaw === null) {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("Report Timeout")
										.setColor("red")
										.setDescription("Report timed out. This thread will be deleted in 30 seconds.")
										.toJSON()
								]
							});
							setTimeout(() => t.delete().catch(() => t.createMessage("Failed to delete thread. Please contact a server administrator to clean up this thread.")), 3e4);
							return null;
						} else if (userMsgRaw.content.toLowerCase() === "cancel") {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("Report Cancelled")
										.setColor("red")
										.setDescription("Report cancelled. This thread will be deleted in 30 seconds.")
										.toJSON()
								]
							});
							return null;
						}
						const userMsg = new ExtendedMessage(userMsgRaw, this);
						await userMsg.load();
						await userMsgRaw.delete().catch(() => null);

						const user = await userMsg.getUserFromArgs();

						if (user === null) {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setTitle("Invalid User")
										.setColor("red")
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setDescription("We couldn't find a user with what you provided.. Please try again, or provide `cancel` to cancel.")
										.toJSON()
								]
							});
							return getUser.call(this);
						} else {
							await m.edit({
								content: "",
								embeds: [
									new EmbedBuilder()
										.setAuthor(msg.author.tag, msg.author.avatarURL)
										.setTitle("User Confirmation")
										.setColor("gold")
										.setDescription(
											"Is this the user you are reporting?",
											"Answer **yes** or **no**.",
											"",
											`User: <@!${user.id}> (\`${user.tag}\`)`,
											`ID: \`${user.id}\``
										)
										.setImage(user.avatarURL)
										.toJSON()
								]
							});

							const confirmMsg = await MessageCollector.awaitMessages(t.id, 3e4, (mf) => mf.author.id === msg.author.id);
							if (confirmMsg === null) {
								await m.edit({
									content: "",
									embeds: [
										new EmbedBuilder()
											.setAuthor(msg.author.tag, msg.author.avatarURL)
											.setTitle("Report Timeout")
											.setColor("red")
											.setDescription("Report timed out. This thread will be deleted in 30 seconds.")
											.toJSON()
									]
								});
								setTimeout(() => t.delete().catch(() => t.createMessage("Failed to delete thread. Please contact a server administrator to clean up this thread.")), 3e4);
								return null;
							} else {
								await confirmMsg.delete().catch(() => null);
								if (confirmMsg.content.toLowerCase() !== "yes") {
									await m.edit({
										content: "",
										embeds: [
											new EmbedBuilder()
												.setAuthor(msg.author.tag, msg.author.avatarURL)
												.setTitle("Report Cancelled")
												.setColor("red")
												.setDescription("Report cancelled. This thread will be deleted in 30 seconds.")
												.toJSON()
										]
									});
									setTimeout(() => t.delete().catch(() => t.createMessage("Failed to delete thread. Please contact a server administrator to clean up this thread.")), 3e4);
									return null;
								} else return user;
							}
						}
					}

					const user = await getUser.call(this);
					if (user === null) return;

					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder()
								.setAuthor(msg.author.tag, msg.author.avatarURL)
								.setTitle("Report Reason")
								.setColor("gold")
								.setDescription("Got it. Please provide a reason for the report.")
								.setFooter(`Reported User: ${user.tag}`, user.avatarURL)
								.toJSON()
						]
					});
					const reasonMsg = await MessageCollector.awaitMessages(t.id, 3e4, (mf) => mf.author.id === msg.author.id);
					if (reasonMsg === null) {
						await m.edit({
							content: "",
							embeds: [
								new EmbedBuilder()
									.setAuthor(msg.author.tag, msg.author.avatarURL)
									.setTitle("Report Timeout")
									.setColor("red")
									.setDescription("Report timed out. This thread will be deleted in 30 seconds.")
									.toJSON()
							]
						});
						setTimeout(() => t.delete().catch(() => t.createMessage("Failed to delete thread. Please contact a server administrator to clean up this thread.")), 3e4);
						return null;
					} else {
						await reasonMsg.delete().catch(() => null);
						const r = await msg.gConfig.createReport(msg.author.id, user.id, t.id, "thread", reasonMsg.content);

						await m.edit({
							content: "",
							embeds: [
								new EmbedBuilder()
									.setAuthor(msg.author.tag, msg.author.avatarURL)
									.setTitle("Report Complete")
									.setColor("gold")
									.setDescription(
										"Your report is finished, and has been sent to this server's staff. If they do not reply within 24 hours, this will be auto archived.",
										"",
										`Report Id: \`${r}\``,
										`User Reported: <@!${user.id}> (${user.tag})`
									)
									.toJSON()
							]
						});
						await t.edit({
							name: `User Report (${r})`
						});
					}
					break;
				}

				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				default: return msg.reply(`This server's report type (\`${msg.gConfig.reports.type}\`) is invalid, please contact a developer.`);
			}
		} */
	});
