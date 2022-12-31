import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { Colors } from "../../../util/Constants.js";
import { State } from "../../../util/State.js";
import CommandOption from "../../../util/cmd/CommandOption.js";
import Config from "../../../config/index.js";
import type { YiffTypes } from "../../../db/Models/UserConfig.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { ComponentBuilder, ButtonColors } from "@oceanicjs/builders";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "yiff")
    .setDescription("Y-you know what this is..")
    .setRestrictions("nsfw")
    .setAck("ephemeral-user")
    .addOption(
        new CommandOption(ApplicationCommandOptionTypes.STRING, "type")
            .setDescription("The type of yiff to fetch (defaults to guild settings, or user preference, if set)")
            .setChoices(Config.yiffTypes.map(type => ({
                name:  Strings.ucwords(type),
                value: type
            })))
    )
    .setOptionsParser(interaction => ({
        type: interaction.data.options.getString<YiffTypes>("type")
    }))
    .setCooldown(1e4)
    .setExecutor(async function(interaction, { type }) {
        if (!type) {
            type = (await UserConfig.get(interaction.user.id)).preferences.defaultYiffType;
        }
        const img = await Util.getYiff(type);
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${Strings.ucwords(type)} Yiff!`)
                .setImage(img.url)
                .setColor(Colors.gold)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(3)
                .addURLButton({
                    label: "Full Image",
                    url:   img.shortURL
                })
                .addURLButton({
                    disabled: img.sources.length === 0,
                    label:    "Source",
                    url:      img.sources[0] || "https://yiff.rest"
                })
                .addURLButton({
                    disabled: !img.reportURL,
                    label:    "Report",
                    url:      img.reportURL || "https://report.yiff.media"
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "yiff", "new").withExtra({ type }).encode(),
                    label:    "New Image",
                    style:    ButtonColors.GREY
                })
                .addInteractionButton({
                    customID: State.partialExit(),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        });
    });
