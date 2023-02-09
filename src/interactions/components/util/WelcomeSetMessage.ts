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
        const message = await db.redis.get(`welcome-set:${interaction.guildID}:${state.uuid}`);
        if (!message) {
            await interaction.editParent(Util.replaceContent({
                content: "H-hey! Something went wrong, try again."
            }));
            return;
        }

        const gConfig = await GuildConfig.get(interaction.guildID);
        await gConfig.edit({
            welcome_message: message
        });

        const old = await db.redis.get(`welcome-edit:${interaction.guildID}:${state.uuid}`);
        if (old !== null) {
            const [token, id] = EncryptionHandler.decrypt(old).split(":");
            await interaction.client.rest.interactions.deleteFollowupMessage(interaction.applicationID, token, id).catch(() => null);
        }

        await interaction.editParent(Util.replaceContent({
            content: "The welcome message has been updated."
        }));
    }
}
