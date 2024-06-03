import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Leveling from "../../../util/Leveling.js";
import Util from "../../../util/Util.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { Colors } from "../../../util/Constants.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";
import { profileImage } from "discord-arts";

export default new Command(import.meta.url, "rank")
    .setDescription("Get a user's rank")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to get the rank of")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user") || interaction.user
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction, { user }) {
        const { rank, total } = await Leveling.getUserRank(user.id, interaction.guildID);
        const xp = await UserConfig.getXP(user.id, interaction.guildID);
        const { level, leftover, needed } = Leveling.calcLevel(xp);
        const customBadges: Array<string> = [];
        if (user.id === "242843345402069002") {
            customBadges.push("https://cdn.discordapp.com/emojis/851308838959579152.png?size=4096");
        }
        const img = await profileImage(user.id, {
            badgesFrame: true,
            rankData:    {
                currentXp:     leftover,
                requiredXp:    leftover + needed,
                rank,
                level,
                barColor:      Colors.violet.toString(16).padStart(6, "0"),
                autoColorRank: true
            }
        });
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`Rank Info For ${user.tag}`)
                .setDescription([
                    `Level: **${level}** (${leftover}/${leftover + needed})`,
                    `EXP: ${xp.toLocaleString()}`,
                    `Local Rank: **${rank}**/**${total}**`
                ])
                .setImage("attachment://rank.png")
                .toJSON(true),
            files: [
                {
                    name:     "rank.png",
                    contents: img
                }
            ]
        });
    });
