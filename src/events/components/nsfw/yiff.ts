import ComponentInteractionHandler from "../main";
import Yiffy from "@util/req/Yiffy";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/components/ComponentHelper";
import type { JSONResponse } from "yiffy";
import BotFunctions from "@util/BotFunctions";
import { Strings } from "@uwu-codes/utils";
import type GuildConfig from "@models/Guild/GuildConfig";

ComponentInteractionHandler
	.registerHandler("yiff-newimg-", false, async function handler(interaction) {
		const type = interaction.data.custom_id.split(".")[0].split("-")[2] as Exclude<GuildConfig["settings"]["defaultYiffType"], null>;
		let img: JSONResponse;
		try {
			img = await Yiffy.furry.yiff[type]("json", 1);
		} catch {
			return interaction.editParent(BotFunctions.replaceContent("Internal Error."));
		}
		return interaction.editParent({
			embeds: [
				new EmbedBuilder(true, interaction.member.user)
					.setTitle(`${Strings.ucwords(type)} Yiff!`)
					.setImage(img.url)
					.setColor("gold")
					.toJSON()
			],
			components: new ComponentHelper(3)
				.addURLButton(img.shortURL, false, undefined, "Full Image")
				.addURLButton(img.sources[0] || "https://yiff.rest", img.sources.length === 0, undefined, "Source")
				.addURLButton(img.reportURL, false, undefined, "Report")
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `yiff-newimg-${type}.${interaction.member.id}`, false, undefined, "New Image")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `general-exit-2.${interaction.member.id}`, false, undefined, "Exit")
				.toJSON()
		});
	});
