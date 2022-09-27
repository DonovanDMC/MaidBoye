import GuildConfig from "../../../db/Models/GuildConfig.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class SelfrolesConfirmRemoveComponent extends BaseComponent {
    action = "confirm-remove";
    command = "selfroles";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { role }: BaseState & { role: string; }) {
        // just in case someone opens a menu then loses permissions
        if (!interaction.member.permissions.has("MANAGE_ROLES")) return interaction.editParent(Util.replaceContent({ content: `H-hey! You don't have permission to use that <@!${interaction.user.id}>...` }));
        const gConfig = await GuildConfig.get(interaction.guildID);
        // components never expire and multiple can be opened
        if (gConfig.selfroles.includes(role)) {
            gConfig.selfroles.splice(gConfig.selfroles.indexOf(role), 1);
            await gConfig.edit({ selfroles: gConfig.selfroles });
        }

        return interaction.editParent(Util.replaceContent({ content: `Congrats, <@&${role}> is no longer self assignable` }));
    }
}
