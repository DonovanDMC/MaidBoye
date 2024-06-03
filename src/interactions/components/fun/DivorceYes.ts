import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { BaseState } from "../../../util/State.js";
import UserConfig from "../../../db/Models/UserConfig.js";

export default class DivorceYesComponent extends BaseComponent {
    action = "yes";
    command = "divorce";

    protected override async handle(interaction: ComponentInteraction, data: BaseState & { dUser: string; }) {
        const user = await UserConfig.get(interaction.user.id);
        const dUser = await UserConfig.get(data.dUser);
        if (!user.marriagePartners.includes(data.dUser)) {
            if (dUser.marriagePartners.includes(interaction.user.id)) {
                await dUser.edit({ marriage_partners: dUser.marriagePartners.filter(p => p !== interaction.user.id) });
            }
            await interaction.reply({ content: "Something's not right here.. Maybe they already divorced you, or you already divorced them?" });
            return;
        }
        if (!dUser.marriagePartners.includes(interaction.user.id)) {
            if (user.marriagePartners.includes(data.dUser)) {
                await user.edit({ marriage_partners: user.marriagePartners.filter(p => p !== data.dUser) });
            }
            await interaction.reply({ content: "Something's not right here.. Maybe they already divorced you, or you already divorced them?" });
            return;
        }
        await user.edit({ marriage_partners: user.marriagePartners.filter(p => p !== data.dUser) });
        await dUser.edit({ marriage_partners: dUser.marriagePartners.filter(p => p !== interaction.user.id) });
        await interaction.reply({ content: `You've successfully divorced <@!${data.dUser}>.` });
    }
}
