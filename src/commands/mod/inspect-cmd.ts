import Command from "@cmd/Command";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import MaidBoye from "@MaidBoye";
import Eris, { DiscordRESTError } from "eris";
import chunk from "chunk";
import { emojis } from "@config";
import BotFunctions from "@util/BotFunctions";
import { Strings } from "@uwu-codes/utils";
import WarnEntry from "@db/Models/Guild/ModLog/WarnEntry";
import { AnyEntry } from "@db/Models/Guild/ModLog/All";
import ModLogHandler from "@util/handlers/ModLogHandler";
import ErrorHandler from "@util/handlers/ErrorHandler";

export default new Command("inspect")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user")
	.setDescription("Get the moderation info of a user")
	.setUsage("<user> [section]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to inspect",
			required: true
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "section",
			description: "The section to open",
			required: false,
			choices: [
				{
					name: "Strike History",
					value: "strikes"
				},
				{
					name: "Moderation History",
					value: "moderation"
				},
				{
					name: "Warning History",
					value: "warnings"
				}
			]
		}
	])
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.USER, "Inspect User")
	.setCooldown(3e3)
	.setParsedFlags("debug")
	.setExecutor(async function(msg) {
		try {
			const debug = msg.dashedArgs.value.includes("debug");
			const member = await msg.getMemberFromArgs();
			if (member === null) return msg.reply("Th-that wasn't a valid member..");
			const user = await db.getUser(member.id);
			const strikes = await user.getStrikes(msg.channel.guild.id, true);
			const pStrike = chunk(strikes.sort((a, b) => a.strikes[0].createdAt - b.strikes[0].createdAt), 5);
			const totalStrikes = strikes.reduce((a, b) => a + b.strikes.length, 0);
			//                                                                           warnings are on their own
			const mod = await user.getModlogEntries(msg.gConfig).then(m => m.filter(v => !(v instanceof WarnEntry)) as Array<Exclude<AnyEntry, WarnEntry>>);
			const pMod = chunk(mod.sort((a, b) => a.createdAt - b.createdAt), 3);
			const warnings = await user.getWarnings(msg.channel.guild.id);
			const pWarnings = chunk(warnings.sort((a, b) => a.createdAt - b.createdAt), 5);
			let page = -1;

			const m = await msg.reply("Warming up..");
			async function main(this: MaidBoye) {
				await m.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle(`Inspection: ${member!.tag}`)
							.setDescription(
								`Total Strikes: **${totalStrikes}**`,
								`Total ModLog Entries: **${mod.length}**`,
								`Total Warnings: **${warnings.length}**`,
								"",
								`Most Recent Strike: ${totalStrikes === 0 ? "Never" : BotFunctions.formatDiscordTime(pStrike.slice(-1)[0].slice(-1)[0].strikes.slice(-1)[0].createdAt, "relative", true)}`,
								`Most Recent Moderation Action: ${pMod.length === 0 ? "Never" : BotFunctions.formatDiscordTime(pMod.slice(-1)[0].slice(-1)[0].createdAt, "relative", true)}`,
								`Most Recent Warning: ${pWarnings.length === 0 ? "Never" : BotFunctions.formatDiscordTime(pWarnings.slice(-1)[0].slice(-1)[0].createdAt, "relative", true)}`,
								"(logs are sorted oldest to newest, top to bottom)"
							)
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-strikes.${msg.author.id}`, false, undefined, "Strike History")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-moderation.${msg.author.id}`, false, undefined, "Moderation History")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-warnings.${msg.author.id}`, false, undefined, "Warning History")
						.toJSON()
				});
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.data.custom_id.startsWith("inspect-") && it.message.id === m.id && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Menu Closed")
								.setDescription("Closed due to interaction timeout.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					if (wait.data.custom_id.includes("strikes")) void strikeHistory.call(this);
					else if (wait.data.custom_id.includes("moderation")) void moderationHistory.call(this);
					else if (wait.data.custom_id.includes("warnings")) void warningHistory.call(this);
					else return;
				}
			}

			async function strikeHistory(this: MaidBoye) {
				if (page === -1) page = 1;
				await m.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle(`Strike History: ${member!.tag}`)
							.setDescription(pStrike.length === 0 ? "This user has no strike history." : await Promise.all(pStrike[page - 1].map(async(s) => {
								const blame = await this.getUser(s.strikes[0].createdBy);
								return `**${s.strikes.length}** strike${s.strikes.length !== 1 ? "s" : ""} added by \`${blame === null ? s.strikes[0].createdBy : blame.tag}\` on ${BotFunctions.formatDiscordTime(s.strikes[0].createdAt, "short-datetime", true)}${debug ? ` (group: \`${s.id}\`)` : ""}\n`;
							})))
							.setFooter(pStrike.length === 0 ? "UwU" : `UwU | Page ${page}/${pStrike.length}`)
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-prev.${msg.author.id}`, pStrike.length === 0 || page === 1, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Previous Page")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-next.${msg.author.id}`, pStrike.length === 0 || page === pStrike.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Next Page")
						.toJSON()
				});
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.data.custom_id.startsWith("inspect-") && it.message.id === m.id && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Menu Closed")
								.setDescription("Closed due to interaction timeout.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					if (wait.data.custom_id.includes("prev")){
						page--;
						void strikeHistory.call(this);
					} else if (wait.data.custom_id.includes("home")) {
						page = -1;
						void main.call(this);
					} else if (wait.data.custom_id.includes("next")) {
						page++;
						void strikeHistory.call(this);
					} else return;
				}
			}

			async function moderationHistory(this: MaidBoye) {
				if (page === -1) page = 1;
				await m.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle(`Moderation History: ${member!.tag}`)
							.setDescription(pMod.length === 0 ? "This user has no moderation history." : await Promise.all(pMod[page - 1].map(async(md) =>
								`Case: **#${md.entryId}**\nType: **${ModLogHandler.entryToString(md)}**\nBlame: <@!${md.blame === "automatic" ? this.user.id : md.blame}>\nReason: ${Strings.truncate(md.reason ?? "None Provided", 50)}\nDate Created: ${BotFunctions.formatDiscordTime(md.createdAt, "short-datetime", true)}${debug ? ` (id: \`${md.id}\`)` : ""}\n`
							)))
							.setFooter(pMod.length === 0 ? "UwU" : `UwU | Page ${page}/${pMod.length}`)
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-prev.${msg.author.id}`, pMod.length === 0 || page === 1, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Previous Page")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-next.${msg.author.id}`, pMod.length === 0 || page === pMod.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Next Page")
						.toJSON()
				});
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.data.custom_id.startsWith("inspect-") && it.message.id === m.id && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Menu Closed")
								.setDescription("Closed due to interaction timeout.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					if (wait.data.custom_id.includes("prev")){
						page--;
						void moderationHistory.call(this);
					} else if (wait.data.custom_id.includes("home")) {
						page = -1;
						void main.call(this);
					} else if (wait.data.custom_id.includes("next")) {
						page++;
						void moderationHistory.call(this);
					} else return;
				}
			}

			async function warningHistory(this: MaidBoye) {
				if (page === -1) page = 1;
				await m.edit({
					content: "",
					embeds: [
						new EmbedBuilder(true, msg.author)
							.setTitle(`Warning History: ${member!.tag}`)
							.setDescription(pWarnings.length === 0 ? "This user has no warning history." : await Promise.all(pWarnings[page - 1].map(async(w) => {
								const blame = await this.getUser(w.blameId);
								return `**#${w.warningId}**\nBlame: \`${blame === null ? w.blameId : blame.tag}\`\nReason: ${Strings.truncate(w.reason ?? "None Provided", 50)}\nDate Created: ${BotFunctions.formatDiscordTime(w.createdAt, "short-datetime", true)}${debug ? ` (id: \`${w.id}\`)` : ""}\n`;
							})))
							.setFooter(pWarnings.length === 0 ? "UwU" : `UwU | Page ${page}/${pWarnings.length}`)
							.toJSON()
					],
					components: new ComponentHelper()
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-prev.${msg.author.id}`, pWarnings.length === 0 || page === 1, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Previous Page")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-home.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.home, "default"), "Home")
						.addInteractionButton(ComponentHelper.BUTTON_PRIMARY, `inspect-next.${msg.author.id}`, pWarnings.length === 0 || page === pWarnings.length, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Next Page")
						.toJSON()
				});
				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.data.custom_id.startsWith("inspect-") && it.message.id === m.id && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						content: "",
						embeds: [
							new EmbedBuilder(true, msg.author)
								.setTitle("Menu Closed")
								.setDescription("Closed due to interaction timeout.")
								.setColor("red")
								.toJSON()
						],
						components: []
					});
					return;
				} else {
					await wait.acknowledge();
					if (wait.data.custom_id.includes("prev")){
						page--;
						void warningHistory.call(this);
					} else if (wait.data.custom_id.includes("home")) {
						page = -1;
						void main.call(this);
					} else if (wait.data.custom_id.includes("next")) {
						page++;
						void warningHistory.call(this);
					} else return;
				}
			}
			switch (msg.args[1]?.toLowerCase()) {
				case "strike": case "strikes": return void strikeHistory.call(this);
				case "mod": case "moderation": return void moderationHistory.call(this);
				case "warning": case "warnings": return void warningHistory.call(this);
				default: return void main.call(this);
			}
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
