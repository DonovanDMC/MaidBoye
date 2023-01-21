import AutoPostingEntry, { AutoPostingStatus, AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";
import short from "short-uuid";

const expandUUID = (str: string) => short().toUUID(str);
export default class AutoPostingDisableComponent extends BaseComponent {
    action = "disable";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { entry }: BaseState & { entry: string; }) {
        if (entry === "all") {
            const autos = await AutoPostingEntry.getAll(interaction.guild.id, "enabled");
            for (const auto of autos) {
                await auto.disable(AutoPostingStatus.DISABLED);
            }
            return interaction.editParent(Util.replaceContent({
                content: `Disabled **${autos.length}** autoposting entries.`
            }));
        }

        const uuid = expandUUID(entry);

        const auto = await AutoPostingEntry.get(uuid);
        if (!auto) {
            return interaction.editParent(Util.replaceContent({
                content: "Something broke.."
            }));
        }
        await auto.disable(AutoPostingStatus.DISABLED);
        return interaction.editParent(Util.replaceContent({
            content: `Disabled autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** every **${auto.time} Minutes** in <#${auto.channelID}>.`
        }));
    }
}
