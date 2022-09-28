import { getPage } from "../../applicationCommands/util/levelroles.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import type MaidBoye from "../../../main.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class LevelRolesNavComponent extends BaseComponent {
    action = "nav";
    command = "levelroles";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { page }: BaseState & { page: number; }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        const content = await getPage.call(interaction.client as MaidBoye, interaction, gConfig, page);
        return interaction.editParent(content);
    }
}
