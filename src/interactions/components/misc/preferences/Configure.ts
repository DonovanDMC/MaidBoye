import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import Preferences from "../../../../util/preferences/index.js";
import UserConfig from "../../../../db/Models/UserConfig.js";
import type { SelectMenuComponentInteraction } from "../../../../util/cmd/Command.js";
import assert from "node:assert";

export default class PreferencesMenuComponent extends BaseComponent {
    action = "configure";
    command = "preferences";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override async handle(interaction: SelectMenuComponentInteraction, data: BaseState) {
        const pref = Preferences.getByInteractionName(interaction.data.values.getStrings()[0]);
        assert(pref, `invalid preference recieved in pick (${interaction.data.values.getStrings()[0]})`);
        const uConfig = await UserConfig.get(interaction.user.id);
        await pref.open(interaction, uConfig);
    }
}
