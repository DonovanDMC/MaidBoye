import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import CommandOption from "../../../util/cmd/CommandOption.js";
import Config from "../../../config/index.js";
import type { YiffTypes } from "../../../db/Models/UserConfig.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";

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
        return Util.handleGenericImage(interaction, `yiff.${type}`);
    });
