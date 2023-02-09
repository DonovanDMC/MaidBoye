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

    override async handleGuild(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, components: Record<string, string | undefined>, state: BaseState & { noFollowupEdit?: boolean; uuid: string | null;  }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        const joinMessage = components.joinMessage!;
        const leaveMessage = components.leaveMessage!;
        if (joinMessage.length > 500) {
            return interaction.reply({
                content: "H-hey! The join message is too long.."
            });
        }
        if (leaveMessage.length > 500) {
            return interaction.reply({
                content: "H-hey! The leave message is too long.."
            });
        }

        const uuid = shortUUID().generate();
        await db.redis.setex(`welcome-set:${interaction.guildID}:${uuid}:join`, 60 * 15, joinMessage);
        await db.redis.setex(`welcome-set:${interaction.guildID}:${uuid}:leave`, 60 * 15, leaveMessage);
        await interaction.editParent(Util.replaceContent({
            content:    "A preview of the join and leave messages are shown below. The first is join, the second is leave. If they look ok, click **OK** below to continue, else click **Edit** to change the message, or **Cancel** to cancel. If you would like a reference of the variables you can use, click **Show Variables**.",
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
                    customID: State.new(interaction.user.id, "welcome", "cancel").with("uuid", state.uuid || uuid).encode(),
                    label:    "Cancel",
                    style:    ButtonColors.RED
                })
                .toJSON()
        }));

        let newFollowupJoin = true, newFollowupLeave = true;
        if (state.uuid) {
            const oldJoin = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}:join`);
            if (oldJoin !== null) {
                const [token, id] = EncryptionHandler.decrypt(oldJoin).split(":");
                console.log("join", token.slice(0, 20), id);
                newFollowupJoin = await interaction.client.rest.interactions.editFollowupMessage(interaction.applicationID, token, id, {
                    ...WelcomeMessageHandler.format(gConfig, interaction.member, "join", joinMessage),
                    flags: MessageFlags.EPHEMERAL
                }).then(() => false);
            }

            const oldLeave = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}:leave`);
            if (oldLeave !== null) {
                const [token, id] = EncryptionHandler.decrypt(oldLeave).split(":");
                console.log("leave", token.slice(0, 20), id);
                newFollowupLeave = await interaction.client.rest.interactions.editFollowupMessage(interaction.applicationID, token, id, {
                    ...WelcomeMessageHandler.format(gConfig, interaction.member, "leave", leaveMessage),
                    flags: MessageFlags.EPHEMERAL
                }).then(() => false);
            }
        }

        if (newFollowupJoin) {
            const f = await interaction.createFollowup({
                ...WelcomeMessageHandler.format(gConfig, interaction.member, "join", joinMessage),
                flags: MessageFlags.EPHEMERAL
            });
            await db.redis.setex(`welcome-edit:${interaction.guildID}:${uuid}:join`, 60 * 15, EncryptionHandler.encrypt(`${interaction.token}:${f.id}`));
        }

        if (newFollowupLeave) {
            const f = await interaction.createFollowup({
                ...WelcomeMessageHandler.format(gConfig, interaction.member, "leave", leaveMessage),
                flags: MessageFlags.EPHEMERAL
            });
            await db.redis.setex(`welcome-edit:${interaction.guildID}:${uuid}:leave`, 60 * 15, EncryptionHandler.encrypt(`${interaction.token}:${f.id}`));
        }
    }
}
