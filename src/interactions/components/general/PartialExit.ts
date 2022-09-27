import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class PartialExitComponent extends BaseComponent {
    action = "partial-exit";
    command = null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override async handle(interaction: ComponentInteraction, data: BaseState) {
        return interaction.editParent({
            // only remove the last row, which in this case has the exit
            components: interaction.message.components?.slice(0, -1) ?? []
        });
    }
}
