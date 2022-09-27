import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class DuckComponent extends BaseComponent {
    action = "new";
    command = "duck";

    protected override handle(interaction: ComponentInteraction) {
        return Util.handleGenericImage(interaction, this.command);
    }
}
