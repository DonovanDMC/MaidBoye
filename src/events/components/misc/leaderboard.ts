import ComponentInteractionHandler from "../main";
import db from "@db";
import type { CountResponse } from "@util/@types/MariaDB";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/components/ComponentHelper";
import { emojis, lbPerPage } from "@config";
import BotFunctions from "@util/BotFunctions";

ComponentInteractionHandler
	.registerHandler("lb-", false, async function handler(interaction) {
		const global = interaction.data.custom_id.includes("global");
		const lbTotal = await db.query(`SELECT COUNT(*) FROM levels${global ? "" : " WHERE guild_id=?"}`, global ? [] : [interaction.member.guild.id]).then((c: CountResponse) => Number(c[0]["COUNT(*)"]));
		const maxPages = Math.ceil(lbTotal / lbPerPage);
		let page = Number(interaction.data.custom_id.split(".")[1].split("-")[1]);
		const action = interaction.data.custom_id.split(".")[0].split("-")[1];
		switch (action) {
			case "first": page = 1; break;
			case "prev": page--; break;
			case "next": page++; break;
			case "last": page = maxPages; break;
		}
		const lb = await (global ? BotFunctions.getGlobalLeaderboard(page) : BotFunctions.getGuildLeaderboard(interaction.member.guild.id, page));
		return interaction.editParent({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle(global ? "Global Leaderboard" : "Server Loeaderboard")
					.setDescription(
						await Promise.all(lb.map(async(v, i) => {
							const u = await this.getUser(v.user);
							return `${((page - 1) * lbPerPage) + (i + 1)}.) **${u === null ? `${v.user}:${v.guild}` : u.tag}** - Level **${v.xp.level}** (${v.xp.leftover}/${v.xp.leftover + v.xp.needed})`;
						}))
					)
					.setFooter(`Page ${page}/${maxPages} | Results Are Cached For ${global ? "5" : "2"} Minutes`, interaction.member.guild.iconURL || undefined)
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-first.page-${page}.${global ? "global" : `guild-${interaction.member.guild.id}`}.${interaction.member.id}`, page === 1, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "First")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-prev.page-${page}.${global ? "global" : `guild-${interaction.member.guild.id}`}.${interaction.member.id}`, page === 1, ComponentHelper.emojiToPartial(emojis.default.first, "default"), "Previous")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `general-exit.${interaction.member.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"), "Stop")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-next.page-${page}.${global ? "global" : `guild-${interaction.member.guild.id}`}.${interaction.member.id}`, page === maxPages, ComponentHelper.emojiToPartial(emojis.default.last, "default"), "Next")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `lb-last.page-${page}.${global ? "global" : `guild-${interaction.member.guild.id}`}.${interaction.member.id}`, page === maxPages, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Last")
				.toJSON()
		});
	});
