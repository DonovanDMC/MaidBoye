import BotFunctions from "@util/BotFunctions";
import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import db from "@db";
import type { CountResponse } from "@util/@types/MariaDB";
import ComponentHelper from "@util/components/ComponentHelper";
import { emojis, lbPerPage } from "@config";

export default new Command("leaderboard", "lb")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get the leveling leaderboard")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [])
	.setCooldown(3e3)
	.setUsage("[global]")
	.setExecutor(async function(msg) {
		const global = msg.args[0]?.toLowerCase() === "global";
		const lbTotal = await db.query(`SELECT COUNT(*) FROM levels${global ? "" : " WHERE guild_id=?"}`, global ? [] : [msg.channel.guild.id]).then((c: CountResponse) => Number(c[0]["COUNT(*)"]));
		const maxPages = Math.ceil(lbTotal / lbPerPage);
		const page = 1;
		const lb = await (global ? BotFunctions.getGlobalLeaderboard(page) : BotFunctions.getGuildLeaderboard(msg.channel.guild.id, page));

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(global ? "Global Leaderboard" : "Server Leaderboard")
					.setDescription(
						await Promise.all(lb.map(async(v, i) => {
							const u = await this.getUser(v.user);
							return `${((page - 1) * lbPerPage) + (i + 1)}.) **${u === null ? `[${v.user}:${v.guild}]` : u.tag}** - Level **${v.xp.level}** (${v.xp.leftover}/${v.xp.leftover + v.xp.needed})`;
						}))
					)
					.setFooter(`Page ${page}/${maxPages} | Results Are Cached For ${global ? "5" : "2"} Minutes`, msg.channel.guild.iconURL || undefined)
					.toJSON()
			],
			components: maxPages === 1 ? [] : new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-first.page-${page}.${global ? "global" : `guild-${msg.channel.guild.id}`}.${msg.author.id}`, page === 1, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "First")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-prev.page-${page}.${global ? "global" : `guild-${msg.channel.guild.id}`}.${msg.author.id}`, page === 1, ComponentHelper.emojiToPartial(emojis.default.first, "default"), "Previous")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `general-exit.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"), "Stop")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-next.page-${page}.${global ? "global" : `guild-${msg.channel.guild.id}`}.${msg.author.id}`, page === maxPages, ComponentHelper.emojiToPartial(emojis.default.last, "default"), "Next")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-last.page-${page}.${global ? "global" : `guild-${msg.channel.guild.id}`}.${msg.author.id}`, page === maxPages, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Last")
				.toJSON()
		});
	});
