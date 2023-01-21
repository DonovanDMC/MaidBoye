import AutoPostingEntry, { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";
import short from "short-uuid";

const expandUUID = (str: string) => short().toUUID(str);
export default class AutoPostingRemoveComponent extends BaseComponent {
    action = "remove";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { entry }: BaseState & { entry: string; }) {
        const uuid = expandUUID(entry);
        const auto = await AutoPostingEntry.get(uuid);
        if (!auto) {
            return interaction.editParent(Util.replaceContent({
                content: "Something broke.."
            }));
        }
        await auto.delete();
        return interaction.editParent(Util.replaceContent({
            content: `Removed autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** every **${auto.time} Minutes** in <#${auto.channelID}>.`
        }));
    }
}
