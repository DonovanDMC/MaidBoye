import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class ExitComponent extends BaseComponent {
    action = "exit";
    command = null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override async handle(interaction: ComponentInteraction, data: BaseState) {
        await interaction.editParent({ components: [] });
    }
}
