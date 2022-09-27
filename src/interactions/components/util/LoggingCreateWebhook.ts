import type { LogEvents } from "../../../db/Models/LogEvent.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import Util from "../../../util/Util.js";
import { ModalActionRow, TextInputStyles } from "oceanic.js";
import { ComponentBuilder } from "@oceanicjs/builders";

export default class LoggingCreateWebhookComponent extends BaseComponent {
    action = "create-webhook";
    command = "logging";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel, event }: BaseState & { channel: string; event: LogEvents; }) {
        await interaction.createModal({
            components: new ComponentBuilder<ModalActionRow>()
                .addTextInput({
                    customID:  "name",
                    label:     "Name",
                    maxLength: 32,
                    minLength: 2,
                    required:  true,
                    style:     TextInputStyles.SHORT,
                    value:     "Maid Boye Logging"
                })
                .addTextInput({
                    customID: "avatar",
                    label:    "Avatar URL",
                    style:    TextInputStyles.SHORT,
                    value:    "https://i.maid.gay/icon.png"
                })
                .toJSON(),
            customID: State.new(interaction.user.id, "logging", "webhook-name").with("channel", channel).with("event", event).encode(),
            title:    "Webhook Name"
        });
        await interaction.editOriginal(Util.replaceContent({
            content: "See the modal."
        }));
    }
}
