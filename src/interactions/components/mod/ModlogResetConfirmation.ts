import GuildConfig from "../../../db/Models/GuildConfig.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class ModlogResetConfirmationComponent extends BaseComponent {
    action = "reset-confirm";
    command = "modlog";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { hook }: BaseState & { hook: string; }) {
        if (!interaction.member.permissions.has("MANAGE_GUILD")) {
            return interaction.editParent(Util.replaceContent({ content: `H-hey! You don't have permission to use that <@!${interaction.user.id}>...` }));
        }
        const gConfig = await GuildConfig.get(interaction.guildID);
        if (!(await ModLogHandler.check(gConfig))) {
            return interaction.editParent(Util.replaceContent({ content: "H-hey! The modlog isn't enabled.." }));
        }
        if (gConfig.modlog.webhook?.id !== hook) {
            return interaction.editParent(Util.replaceContent({ content: "H-hey! Something about the modlog has changed, try again." }));
        }

    }
}
