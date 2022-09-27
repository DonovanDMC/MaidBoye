import type { SelectMenuComponentInteraction, ValidLocation } from "../../../../util/cmd/Command.js";
import type { BaseState } from "../../../../util/State.js";
import BaseComponent from "../../structure/BaseComponent.js";
import GuildConfig from "../../../../db/Models/GuildConfig.js";
import Settings from "../../../../util/settings/index.js";
import { assert } from "tsafe";

export default class SettingsMenuComponent extends BaseComponent {
    action = "configure";
    command = "settings";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override async handleGuild(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, data: BaseState) {
        const set = Settings.getByInteractionName(interaction.data.values[0]);
        assert(set, `invalid setting recieved in pick (${interaction.data.values[0]})`);
        const gConfig = await GuildConfig.get(interaction.guildID);
        await set.open(interaction, gConfig);
    }
}
