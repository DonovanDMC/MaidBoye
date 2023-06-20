/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { type BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import { type ModalActionRow, TextInputStyles } from "oceanic.js";
import { ComponentBuilder } from "@oceanicjs/builders";

export default abstract class CreateWebhookComponent extends BaseComponent {
    action = "create-webhook";

    protected getAvatar(interaction: ComponentInteraction<ValidLocation.GUILD>) {
        return "https://i.maidboye.cafe/icon.png";
    }

    protected getName(interaction: ComponentInteraction<ValidLocation.GUILD>) {
        return "Maid Boye";
    }

    protected withExtra(base: BaseState, state: State) {
        return state;
    }

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & Record<string, string>) {
        await interaction.createModal({
            components: new ComponentBuilder<ModalActionRow>()
                .addTextInput({
                    customID:  "name",
                    label:     "Name",
                    maxLength: 32,
                    minLength: 2,
                    required:  true,
                    style:     TextInputStyles.SHORT,
                    value:     this.getName(interaction)
                })
                .addTextInput({
                    customID: "avatar",
                    label:    "Avatar URL",
                    style:    TextInputStyles.SHORT,
                    value:    this.getAvatar(interaction)
                })
                .toJSON(),
            customID: this.withExtra(state, State.new(interaction.user.id, this.command, "webhook").with("channel", state.channel)).encode(),
            title:    "Webhook"
        });
    }
}
