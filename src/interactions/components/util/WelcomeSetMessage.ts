import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import Util from "../../../util/Util.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import db from "../../../db/index.js";
import EncryptionHandler from "../../../util/handlers/EncryptionHandler.js";

export default class WelcomeSetMessageComponent extends BaseComponent {
    action = "set-message";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { uuid: string; }) {
        const joinMessage = await db.redis.get(`welcome-set:${interaction.guildID}:${state.uuid}:join`);
        const leaveMessage = await db.redis.get(`welcome-set:${interaction.guildID}:${state.uuid}:leave`);
        if (!joinMessage || !leaveMessage) {
            await interaction.editParent(Util.replaceContent({
                content: "H-hey! Something went wrong, try again."
            }));
            return;
        }

        const gConfig = await GuildConfig.get(interaction.guildID);
        await gConfig.edit({
            welcome_join_message:  joinMessage,
            welcome_leave_message: leaveMessage
        });

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

        await interaction.editParent(Util.replaceContent({
            content: "The welcome message has been updated."
        }));
    }
}
