import LogEvent, { LogEvents } from "../../../db/Models/LogEvent.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { Colors } from "../../../util/Constants.js";
import { type BaseState, State } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { MessageActionRow } from "oceanic.js";
import chunk from "chunk";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";

export default class LoggingNavComponent extends BaseComponent {
    action = "nav";
    command = "logging";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel, dir, page }: BaseState & { channel: string | null; dir: -1 | 1; page: number; }) {
        const events = (await LogEvent.getAll(interaction.guild.id)).filter(ev => channel ? ev.channelID === channel : true);
        const list = chunk(events, 10);
        if (dir === -1) {
            page--;
        } else {
            page++;
        }
        return interaction.editParent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setDescription(list[page - 1].map(ev => `**${Util.readableConstant(LogEvents[ev.event])}** in <#${ev.channelID}>`).join("\n"))
                .setColor(Colors.gold)
                .setFooter(`Page ${page}/${list.length}`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "logging", "nav").with("channel", channel).with("page", page).with("dir", -1).encode(),
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
                    customID: State.new(interaction.user.id, "logging", "nav").with("channel", channel).with("page", page).with("dir", 1).encode(),
                    disabled: (page + 1) > list.length,
                    label:    "Next Page",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
    }
}
