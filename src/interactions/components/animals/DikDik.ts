import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class DikDikComponent extends BaseComponent {
    action = "new";
    command = "dikdik";

    protected override handle(interaction: ComponentInteraction) {
        return Util.handleGenericImage(interaction, this.command);
    }
}
