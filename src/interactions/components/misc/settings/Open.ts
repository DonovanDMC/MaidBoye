import type { ComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import Settings from "../../../../util/settings/index.js";
import GuildConfig from "../../../../db/Models/GuildConfig.js";
import { assert } from "tsafe";


export default class SettingsPickComponent extends BaseComponent {
    action = "open";
    command = "settings";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, data: BaseState & { setting: number; }) {
        const set = Settings.getByID(data.setting);
        assert(set, `invalid setting recieved in open (${data.setting})`);
        const gConfig = await GuildConfig.get(interaction.guildID);
        void set.open(interaction, gConfig);
    }
}
