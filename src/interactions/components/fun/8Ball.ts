import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import Config from "../../../config/index.js";
import { EmbedBuilder } from "@oceanicjs/builders";

export default class EightBallComponent extends BaseComponent {
    action = "new";
    command = "8ball";

    protected override async handle(interaction: ComponentInteraction) {
        const image = Config["8ballAnswers"][Math.floor(Math.random() * Config["8ballAnswers"].length)];
        void interaction.editOriginal({
            embeds: EmbedBuilder.loadFromJSON(interaction.message.embeds[0]).setImage(image).toJSON(true)
        });
    }
}
