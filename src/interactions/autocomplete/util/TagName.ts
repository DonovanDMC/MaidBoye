import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import assert from "node:assert";

export default class TagNameAutocomplete extends BaseAutocomplete {
    command = "tag";
    option = "name";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const gConfig = await GuildConfig.get(interaction.guildID);
        if (gConfig.tagNames.length === 0) {
            return interaction.reply([]);
        }
        return interaction.reply(gConfig.tagNames.map(t => ({ name: t, value: t })));
    }
}
