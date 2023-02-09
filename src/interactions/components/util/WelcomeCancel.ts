import db from "../../../db/index.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import EncryptionHandler from "../../../util/handlers/EncryptionHandler.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class WelcomeCancelComponent extends BaseComponent {
    action = "cancel";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { uuid: string; }) {
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

        await interaction.editParent(Util.replaceContent({ content: "Action cancelled." }));
    }
}
