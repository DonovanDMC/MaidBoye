import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import Config from "../../../config/index.js";
import { type BaseState } from "../../../util/State.js";
import { MessageFlags } from "oceanic.js";

export default class EvalDeleteComponent extends BaseComponent {
    action = "delete";
    command = "eval";

    protected override async handle(interaction: ComponentInteraction, { message }: BaseState & { message: string; }) {
        if (!Config.developers.includes(interaction.user.id)) {
            await interaction.reply({
                flags:   MessageFlags.EPHEMERAL,
                content: "H-hey! You are not allowed to use that.."
            });
            return;
        }

        await interaction.client.rest.channels.deleteMessage(interaction.channelID, message);
        await interaction.reply({
            flags:   MessageFlags.EPHEMERAL,
            content: "Deleted the invocation message."
        });
    }
}
