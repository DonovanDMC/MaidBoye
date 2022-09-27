import LogEvent, { LogEvents } from "../../../db/Models/LogEvent.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class LoggingRemoveComponent extends BaseComponent {
    action = "remove";
    command = "logging";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { entry }: BaseState & { entry: string; }) {
        const event = await LogEvent.get(entry);
        if (!event) return interaction.editParent(Util.replaceContent({
            content: "Something broke.."
        }));
        await event.delete();
        return interaction.editParent(Util.replaceContent({
            content: `Removed logging of **${Util.readableConstant(LogEvents[event.event])}** in <#${event.channelID}>.`
        }));
    }
}
