import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { type BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import type MaidBoye from "../../../main.js";
import Config from "../../../config/index.js";
import { Replacements } from "../../../util/handlers/WelcomeMessageHandler.js";
import Util from "../../../util/Util.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default class WelcomeShowVariablesComponent extends BaseComponent {
    action = "show-variables";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { uuid: string; }) {
        const map = Replacements(interaction.member);
        const commandID = (await (interaction.client as MaidBoye).getCommandIDMap()).chatInput.welcome;
        return interaction.editParent(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Welcome Message Editor")
                .setDescription([
                    "The welcome message can be a maximum of 500 characters. The following variables can be used:",
                    ...Object.entries(map).map(([k, v]) => `${Config.emojis.default.dot} **${k}** - ${v}`),
                    "",
                    `Modifiers like enabling mentions and disabling embeds can be toggled via ${commandID ? `</welcome config modifiers:${commandID}>` : "/welcome config modifiers"}`,
                    "Click below to edit the welcome message. A preview will be shown before anything is saved."
                ])
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "welcome", "edit-message").with("uuid", state.uuid).encode(),
                    label:    "Start Editing",
                    style:    ButtonColors.GREEN
                })
                .addInteractionButton({
                    customID: State.cancel(interaction.user.id),
                    label:    "Cancel",
                    style:    ButtonColors.RED
                })
                .toJSON()
        }));
    }
}
