import UserConfig from "../../../db/Models/UserConfig.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class MarryNoComponent extends BaseComponent {
    action = "yes";
    command = "marry";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { partner }: BaseState & { partner: string; }) {
        const user1 = await UserConfig.get(interaction.user.id);
        const user2 = await UserConfig.get(partner);

        await user1.edit({
            marriage_partners: [...user1.marriagePartners, partner]
        });

        await user2.edit({
            marriage_partners: [...user2.marriagePartners, interaction.user.id]
        });

        return interaction.editParent(Util.replaceContent({
            embeds: Util.makeEmbed(true, undefined, interaction.message.embeds[0])
                .setTitle("Congrats!")
                .setDescription(`Congrats <@!${partner}> and <@!${interaction.user.id}>!`)
                .toJSON(true)
        }));
    }
}
