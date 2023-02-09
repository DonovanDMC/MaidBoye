import db from "../../../db/index.js";
import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseModal from "../structure/BaseModal.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import { type BaseState, State } from "../../../util/State.js";
import WelcomeMessageHandler from "../../../util/handlers/WelcomeMessageHandler.js";
import Util from "../../../util/Util.js";
import EncryptionHandler from "../../../util/handlers/EncryptionHandler.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { type MessageActionRow, MessageFlags } from "oceanic.js";
import shortUUID from "short-uuid";

export default class WelcomeMessageModal extends BaseModal {
    action = "message";
    command = "welcome";

    override async handleGuild(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, components: Record<string, string | undefined>, state: BaseState & { uuid: string | null; }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        const message = components.message!;
        if (message.length > 500) {
            return interaction.reply({
                content: "H-hey! That message is too long.."
            });
        }

        const uuid = shortUUID().generate();
        await db.redis.setex(`welcome-set:${interaction.guildID}:${uuid}`, 60 * 15, message);
        await interaction.editParent(Util.replaceContent({
            content:    "When members join, the message shown below this will be sent. If it looks ok, click **OK** below to continue, else click **Edit** to change the message, or **Cancel** to cancel.",
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "welcome", "set-message").with("uuid", uuid).encode(),
                    label:    "OK",
                    style:    ButtonColors.GREEN
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "welcome", "edit-message").with("uuid", state.uuid || uuid).encode(),
                    label:    "Edit",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "welcome", "show-variables").with("uuid", state.uuid || uuid).encode(),
                    label:    "Show Variables",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.cancel(interaction.user.id),
                    label:    "Cancel",
                    style:    ButtonColors.RED
                })
                .toJSON()
        }));

        let newFollowup = true;
        if (state.uuid) {
            try {
                const old = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}`);
                if (old !== null) {
                    const [token, id] = EncryptionHandler.decrypt(old).split(":");
                    newFollowup = await interaction.client.rest.interactions.editFollowupMessage(interaction.applicationID, token, id, {
                        ...WelcomeMessageHandler.format(gConfig, interaction.member, message),
                        flags: MessageFlags.EPHEMERAL
                    }).then(() => false, () => true);
                }
            } catch {}
        }

        if (newFollowup) {
            const f = await interaction.createFollowup({
                ...WelcomeMessageHandler.format(gConfig, interaction.member, message),
                flags: MessageFlags.EPHEMERAL
            });
            await db.redis.setex(`welcome-edit:${interaction.guildID}:${uuid}`, 60 * 15, EncryptionHandler.encrypt(`${interaction.token}:${f.id}`));
        }
    }
}
