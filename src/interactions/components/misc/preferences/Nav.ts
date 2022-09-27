import { changePage } from "./Menu.js";
import type { ComponentInteraction } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import UserConfig from "../../../../db/Models/UserConfig.js";
import Preferences from "../../../../util/preferences/index.js";

export default class PreferencesMenuComponent extends BaseComponent {
    action = "nav";
    command = "preferences";
    override async handle(interaction: ComponentInteraction, data: BaseState & { dir: 0 | 1; page: number; }) {
        const uConfig = await UserConfig.get(interaction.user.id);
        switch (data.dir) {
            case 0: --data.page; break;
            case 1: ++data.page; break;
        }
        if (data.page < 0) data.page = Preferences.getPageCount() - 1;
        if (data.page > (Preferences.getPageCount() - 1)) data.page = 0;
        await changePage(data.page, interaction, uConfig);
    }
}
