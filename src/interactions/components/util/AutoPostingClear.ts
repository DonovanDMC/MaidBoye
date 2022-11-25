import AutoPostingEntry from "../../../db/Models/AutoPostingEntry.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class AutoPostingClearComponent extends BaseComponent {
    action = "clear";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel }: BaseState & { channel: string | null; }) {
        const autos = (await AutoPostingEntry.getAll(interaction.guild.id)).filter(ev => channel ? ev.channelID === channel : true);
        for (const auto of autos) {
            await auto.delete();
        }
        return interaction.editParent(Util.replaceContent({
            content: `Removed ${autos.length} autoposting entries${channel ? ` for <#${channel}>` : ""}.`
        }));
    }
}
