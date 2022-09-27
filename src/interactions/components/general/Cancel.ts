import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import Util from "../../../util/Util.js";

export default class CancelComponent extends BaseComponent {
    action = "cancel";
    command = null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override async handle(interaction: ComponentInteraction, data: BaseState) {
        await interaction.editParent(Util.replaceContent({ content: "Action cancelled." }));
    }
}
