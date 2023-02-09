import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { type BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import { type ModalActionRow, TextInputStyles } from "oceanic.js";
import { ComponentBuilder } from "@oceanicjs/builders";

export default class WelcomeEditMessageComponent extends BaseComponent {
    action = "edit-message";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { uuid?: string; }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        await interaction.createModal({
            components: new ComponentBuilder<ModalActionRow>()
                .addTextInput({
                    customID:  "joinMessage",
                    label:     "Join Message Content",
                    maxLength: 500,
                    minLength: 2,
                    required:  true,
                    style:     TextInputStyles.PARAGRAPH,
                    value:     gConfig.welcome.joinMessage
                }).addTextInput({
                    customID:  "leaveMessage",
                    label:     "Leave Message Content",
                    maxLength: 500,
                    minLength: 2,
                    required:  true,
                    style:     TextInputStyles.PARAGRAPH,
                    value:     gConfig.welcome.leaveMessage
                })
                .toJSON(),
            customID: State.new(interaction.user.id, "welcome", "message").with("uuid", state.uuid || null).encode(),
            title:    "Welcome Message"
        });
    }
}
