import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class GenericImageNewComponent extends BaseComponent {
    action = "new";
    command = "generic-image";

    protected override handle(interaction: ComponentInteraction, { type }: BaseState & { type: string; }) {
        return Util.handleGenericImage(interaction, type);
    }
}
