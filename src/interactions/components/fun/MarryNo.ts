import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class MarryNoComponent extends BaseComponent {
    action = "no";
    command = "marry";

    override async handleGuild(interaction: ComponentInteraction) {
        return interaction.editParent(Util.replaceContent({ content: "Better luck next time.." }));
    }
}
