import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import Util from "../../../util/Util.js";
import AutoPostingEntry, { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import { assert } from "tsafe";
import type { AnyGuildTextChannelWithoutThreads } from "oceanic.js";
import FuzzySearch from "fuzzy-search";

export default class AutoPostingEntryAutocomplete extends BaseAutocomplete {
    command = "autoposting";
    option = "entry";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const autos = await AutoPostingEntry.getAll(interaction.guild.id);
        const choices = autos.map(a => ({ name: `${Util.readableConstant(AutoPostingTypes[a.type])} in #${interaction.client.getChannel<AnyGuildTextChannelWithoutThreads>(a.channelID)?.name ?? a.channelID}`, value: a.id }));
        const fuzzy = new FuzzySearch(choices, ["name"], { caseSensitive: false });
        return interaction.reply(fuzzy.search(focused.value));
    }
}
