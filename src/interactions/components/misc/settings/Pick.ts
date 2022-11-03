import type { ComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import Settings from "../../../../util/settings/index.js";
import GuildConfig from "../../../../db/Models/GuildConfig.js";
import { assert } from "tsafe";
import { ComponentTypes } from "oceanic.js";


export default class SettingsPickComponent extends BaseComponent {
    action = "pick";
    command = "settings";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, data: BaseState & { setting: number; value?: string | number; }) {
        if (interaction.data.componentType === ComponentTypes.BUTTON) assert(data.value !== undefined, `no value present in pick (${data.setting})`);
        const set = Settings.getByID(data.setting);
        assert(set, `invalid setting recieved in pick (${data.setting})`);
        const gConfig = await GuildConfig.get(interaction.guildID);
        await set.handlePick(interaction, gConfig, interaction.data.componentType === ComponentTypes.BUTTON ? data.value! : interaction.data.values.getStrings()[0]);
    }
}
