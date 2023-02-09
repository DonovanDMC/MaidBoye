import GuildConfig from "../../../db/Models/GuildConfig.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";

export default class ModlogResetComponent extends BaseComponent {
    action = "reset";
    command = "modlog";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { hook: string | null; }) {
        if (!interaction.member.permissions.has("MANAGE_GUILD")) {
            return interaction.editParent(Util.replaceContent({ content: `H-hey! You don't have permission to use that <@!${interaction.user.id}>...` }));
        }
        const gConfig = await GuildConfig.get(interaction.guildID);
        if (!(await ModLogHandler.check(gConfig))) {
            return interaction.editParent(Util.replaceContent({ content: "H-hey! The modlog isn't enabled.." }));
        }

        if (state.hook === null) {
            await interaction.editParent(Util.replaceContent({ content: "The modlog has been reset." }));
        } else {
            if (gConfig.modlog.webhook?.id !== state.hook) {
                return interaction.editParent(Util.replaceContent({ content: "H-hey! Something about the modlog has changed, try again." }));
            }

            await interaction.client.rest.webhooks.delete(state.hook, `Modlog Reset: ${interaction.user.tag} (${interaction. user.id})`)
                .then(() => interaction.editParent(Util.replaceContent({ content: "The modlog has been reset, and the webhook has been deleted." })))
                .catch(() => interaction.editParent(Util.replaceContent({ content: "The modlog has been reset. Deleting the webhook failed." })));
        }

        await gConfig.resetModLog();
    }
}
