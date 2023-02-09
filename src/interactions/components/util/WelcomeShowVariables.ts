import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { type BaseState, State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import type MaidBoye from "../../../main.js";
import Config from "../../../config/index.js";
import { Replacements } from "../../../util/handlers/WelcomeMessageHandler.js";
import Util from "../../../util/Util.js";
import db from "../../../db/index.js";
import EncryptionHandler from "../../../util/handlers/EncryptionHandler.js";
import { badgesLink, flagsLink } from "../../applicationCommands/util/welcome.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default class WelcomeShowVariablesComponent extends BaseComponent {
    action = "show-variables";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { uuid: string; }) {
        const map = Replacements(interaction.member);
        const commandID = (await (interaction.client as MaidBoye).getCommandIDMap()).chatInput.welcome;

        const oldJoin = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}:join`);
        if (oldJoin !== null) {
            const [token, id] = EncryptionHandler.decrypt(oldJoin).split(":");
            await interaction.client.rest.interactions.deleteFollowupMessage(interaction.applicationID, token, id).catch(() => null);
        }

        const oldLeave = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}:leave`);
        if (oldLeave !== null) {
            const [token, id] = EncryptionHandler.decrypt(oldLeave).split(":");
            await interaction.client.rest.interactions.deleteFollowupMessage(interaction.applicationID, token, id).catch(() => null);
        }

        return interaction.editParent(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Welcome Message Editor")
                .setDescription([
                    "The welcome message can be a maximum of 500 characters. The following variables can be used:",
                    ...Object.entries(map).map(([k, v]) => `${Config.emojis.default.dot} **${k}** - ${v}`),
                    "",
                    `Modifiers like enabling mentions and disabling embeds can be toggled via ${commandID ? `</welcome config modifiers:${commandID}>` : "/welcome config modifiers"}. Note that the modifiers apply to both join and leave messages. For ease of use, the toggling of join/leave messages is considered a modifier. Note for [badges](${badgesLink}) and [flags](${flagsLink}), this is the same list that is shown in the member add/remove logging. You can see the possible list by clicking on the respective links.`,
                    "Click below to edit the welcome message. A preview will be shown before anything is saved."
                ])
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "welcome", "edit-message").encode(),
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
