import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Leveling from "../../../util/Leveling.js";
import Util from "../../../util/Util.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { Colors } from "../../../util/Constants.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";
import { profileImage } from "discord-arts";

(global as unknown as { customBadges: Record<string, Array<string> | undefined>; }).customBadges = {
    "242843345402069002": ["https://cdn.discordapp.com/emojis/786675436243077140.png"],
    "935392548506189884": ["https://cdn.discordapp.com/emojis/1213921250708168814.png"],
    "157988109445758976": ["https://cdn.discordapp.com/emojis/1016753364018663514.png"],
    "339050872736579589": ["https://cdn.discordapp.com/emojis/994574107574276156.png"],
    "738684490787979304": ["https://cdn.discordapp.com/emojis/1177533288861159434.png"]
};
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
        const img = await profileImage(user.id, {
            badgesFrame:  true,
            customBadges: (global as unknown as { customBadges: Record<string, Array<string> | undefined>; }).customBadges[user.id],
            rankData:     {
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
