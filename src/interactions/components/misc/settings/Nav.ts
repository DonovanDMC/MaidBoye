import { changePage } from "./Menu.js";
import type { ComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import GuildConfig from "../../../../db/Models/GuildConfig.js";
import Settings from "../../../../util/settings/index.js";

export default class SettingsMenuComponent extends BaseComponent {
    action = "nav";
    command = "settings";
    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, data: BaseState & { dir: 0 | 1; page: number; }) {
        const gConfig = await GuildConfig.get(interaction.guildID);
        switch (data.dir) {
            case 0: {
                --data.page;
                break;
            }
            case 1: {
                ++data.page;
                break;
            }
        }
        if (data.page < 0) data.page = Settings.getPageCount() - 1;
        if (data.page > (Settings.getPageCount() - 1)) data.page = 0;
        await changePage(data.page, interaction, gConfig);
    }
}
