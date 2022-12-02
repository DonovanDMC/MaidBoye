import type { SelectMenuComponentInteraction } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import Preferences from "../../../../util/preferences/index.js";
import UserConfig from "../../../../db/Models/UserConfig.js";
import assert from "node:assert";


export default class PreferencesPickComponent extends BaseComponent {
    action = "open";
    command = "preferences";

    override async handle(interaction: SelectMenuComponentInteraction, data: BaseState & { preference: number; }) {
        const pref = Preferences.getByID(data.preference);
        assert(pref, `invalid preference recieved in open (${data.preference})`);
        const uConfig = await UserConfig.get(interaction.user.id);
        void pref.open(interaction, uConfig);
    }
}
