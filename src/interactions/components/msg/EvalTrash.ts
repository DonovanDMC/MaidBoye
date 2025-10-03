import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import Config from "../../../config/index.js";
import { MessageFlags } from "oceanic.js";

export default class EvalTrashComponent extends BaseComponent {
    action = "trash";
    command = "eval";

    protected override async handle(interaction: ComponentInteraction) {
        if (!Config.developers.includes(interaction.user.id)) {
            await interaction.reply({
                flags:   MessageFlags.EPHEMERAL,
                content: "H-hey! You are not allowed to use that.."
            });
            return;
        }

        await interaction.message.delete();
        await interaction.reply({
            flags:   MessageFlags.EPHEMERAL,
            content: "Deleted the response message."
        });
    }
}
