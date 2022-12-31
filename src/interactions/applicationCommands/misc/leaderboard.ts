import type MaidBoye from "../../../main.js";
import Command, { type CommandInteraction, type ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Leveling from "../../../util/Leveling.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { State } from "../../../util/State.js";
import { Timer } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, type InteractionContent, type MessageActionRow } from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";

export async function getPage(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>, type: "server" | "global", page: number) {
    const guildID = type === "global" ? null : interaction.guildID;
    const start = Timer.getTime();
    const { values: lb, total } = await Leveling.getLeaderboard(guildID, page);
    const end = Timer.getTime();
    if (!total) {
        return {
            content: "There are no users in the leaderboard."
        } as InteractionContent;
    }
    return {
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`${type === "global" ? "Global" : "Server"} Leaderboard`)
            .setDescription(
                await Promise.all(lb.map(async(v, i) => {
                    const u = await this.getUser(v.user);
                    return `${((page - 1) * Config.lbPerPage) + (i + 1)}.) **${u === null ? `[${v.user}:${v.guild}]` : u.tag}** - Level **${v.xp.level}** (${v.xp.leftover}/${v.xp.leftover + v.xp.needed})`;
                }))
            )
            .setFooter(`Page ${page} of ${Math.ceil(total / Config.lbPerPage).toLocaleString()} | Generated In ${Timer.calc(start, end, 3, false)}`, Config.botIcon)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>(2)
            .addInteractionButton({
                customID: State.new(interaction.user.id, "leaderboard", "nav").with("page", page - 1).with("type", type).encode(),
                disabled: page === 1,
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "leaderboard", "nav").with("page", page + 1).with("type", type).encode(),
                disabled: page === Math.ceil(total / Config.lbPerPage),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.next, "default"),
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.exit(interaction.user.id),
                emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                label:    "Exit",
                style:    ButtonColors.RED
            })
            .toJSON()
    } as InteractionContent;
}

export default new Command(import.meta.url, "leaderboard")
    .setDescription("Get the top ranked users")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "global")
            .setDescription("Get the global leaderboard")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.NUMBER, "page")
                    .setDescription("The page of the leaderboard to view")
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "server")
            .setDescription("Get the server leaderboard")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.NUMBER, "page")
                    .setDescription("The page of the leaderboard to view")
            )
    )
    .setOptionsParser(interaction => ({
        type: interaction.data.options.getSubCommand<["global" | "server"]>(true)[0],
        page: interaction.data.options.getInteger("page") || 1
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction, { type, page }) {
        const content = await getPage.call(this, interaction, type, page);
        return interaction.reply(content);
    });
