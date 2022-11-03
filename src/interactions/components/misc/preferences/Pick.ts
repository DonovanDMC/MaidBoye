import type { ComponentInteraction } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import UserConfig from "../../../../db/Models/UserConfig.js";
import Preferences from "../../../../util/preferences/index.js";
import { assert } from "tsafe";
import { ComponentTypes } from "oceanic.js";


export default class PreferencesPickComponent extends BaseComponent {
    action = "pick";
    command = "preferences";

    override async handle(interaction: ComponentInteraction, data: BaseState & { preference: number; value?: string | number | null; }) {
        if (interaction.data.componentType === ComponentTypes.BUTTON) assert(data.value !== undefined, `no value present in pick (${data.preference})`);
        const pref = Preferences.getByID(data.preference);
        assert(pref, `invalid preference recieved in pick (${data.preference})`);
        const uConfig = await UserConfig.get(interaction.user.id);
        await pref.handlePick(interaction, uConfig, interaction.data.componentType === ComponentTypes.BUTTON ? data.value! : interaction.data.values.getStrings()[0]);
    }
}
