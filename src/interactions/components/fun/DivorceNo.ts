import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class DivorceNoComponent extends BaseComponent {
    action = "no";
    command = "divorce";

    protected override async handle(interaction: ComponentInteraction) {
        return interaction.reply({ content: "Cancelled." });
    }
}
