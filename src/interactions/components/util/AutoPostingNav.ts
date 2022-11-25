import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { Colors } from "../../../util/Constants.js";
import { BaseState, State } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";
import AutoPostingEntry, { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import type { MessageActionRow } from "oceanic.js";
import chunk from "chunk";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";

export default class AutoPostingNavComponent extends BaseComponent {
    action = "nav";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel, dir, page }: BaseState & { channel: string | null; dir: -1 | 1; page: number; }) {
        const autos = (await AutoPostingEntry.getAll(interaction.guild.id)).filter(ev => channel ? ev.channelID === channel : true);
        const list = chunk(autos, 10);
        if (dir === -1) {
            page--;
        } else {
            page++;
        }
        return interaction.editParent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setDescription(list[page - 1].map(a => `**${Util.readableConstant(AutoPostingTypes[a.type])}** in <#${a.channelID}>`).join("\n"))
                .setColor(Colors.gold)
                .setFooter(`Page ${page}/${list.length}`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel).with("page", page).with("dir", -1).encode(),
                    disabled: (page - 1) < 1,
                    label:    "Previous Page",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel).with("page", page).with("dir", 1).encode(),
                    disabled: (page + 1) > list.length,
                    label:    "Next Page",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
    }
}
