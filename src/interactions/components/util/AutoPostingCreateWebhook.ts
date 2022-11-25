import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import Util from "../../../util/Util.js";
import type { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import { ModalActionRow, TextInputStyles } from "oceanic.js";
import { ComponentBuilder } from "@oceanicjs/builders";

export default class AutoPostingCreateWebhookComponent extends BaseComponent {
    action = "create-webhook";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel, time, type }: BaseState & { channel: string; time: number; type: AutoPostingTypes; }) {
        await interaction.createModal({
            components: new ComponentBuilder<ModalActionRow>()
                .addTextInput({
                    customID:  "name",
                    label:     "Name",
                    maxLength: 32,
                    minLength: 2,
                    required:  true,
                    style:     TextInputStyles.SHORT,
                    value:     "Maid Boye Auto Posting"
                })
                .addTextInput({
                    customID: "avatar",
                    label:    "Avatar URL",
                    style:    TextInputStyles.SHORT,
                    value:    "https://i.maid.gay/icon.png"
                })
                .toJSON(),
            customID: State.new(interaction.user.id, "autoposting", "webhook").with("channel", channel).with("type", type).with("time", time).encode(),
            title:    "Webhook"
        });
        await interaction.editOriginal(Util.replaceContent({
            content: "See the modal."
        }));
    }
}
