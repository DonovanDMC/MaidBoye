import LogEvent from "../../../db/Models/LogEvent.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class LoggingClearComponent extends BaseComponent {
    action = "clear";
    command = "logging";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel }: BaseState & { channel: string | null; }) {
        const events = (await LogEvent.getAll(interaction.guild.id)).filter(ev => channel ? ev.channelID === channel : true);
        for (const ev of events) await ev.delete();
        return interaction.editParent(Util.replaceContent({
            content: `Removed ${events.length} logging entries${channel ? ` for <#${channel}>` : ""}.`
        }));
    }
}
