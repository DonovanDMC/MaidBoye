import GuildConfig from "../../../db/Models/GuildConfig.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import WelcomeMessageHandler from "../../../util/handlers/WelcomeMessageHandler.js";

export default class WelcomeResetComponent extends BaseComponent {
    action = "reset";
    command = "welcome";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, state: BaseState & { hook: string | null; }) {
        if (!interaction.member.permissions.has("MANAGE_GUILD")) {
            return interaction.editParent(Util.replaceContent({ content: `H-hey! You don't have permission to use that <@!${interaction.user.id}>...` }));
        }
        const gConfig = await GuildConfig.get(interaction.guildID);
        if (!(await WelcomeMessageHandler.check(gConfig))) {
            return interaction.editParent(Util.replaceContent({ content: "H-hey! The welcome message isn't enabled.." }));
        }
        if (state.hook === null) {
            await interaction.editParent(Util.replaceContent({ content: "The welcome message has been reset." }));
        } else {
            if (gConfig.welcome.webhook?.id !== state.hook) {
                return interaction.editParent(Util.replaceContent({ content: "H-hey! Something about the welcome message has changed, try again." }));
            }

            await interaction.client.rest.webhooks.delete(state.hook, `Welcome Reset: ${interaction.user.tag} (${interaction. user.id})`)
                .then(() => interaction.editParent(Util.replaceContent({ content: "The welcome message has been reset, and the webhook has been deleted." })))
                .catch(() => interaction.editParent(Util.replaceContent({ content: "The welcome message has been reset. Deleting the webhook failed." })));
        }

        await gConfig.resetWelcome();
    }
}
