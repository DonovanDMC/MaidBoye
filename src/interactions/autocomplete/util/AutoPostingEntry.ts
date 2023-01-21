import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import Util from "../../../util/Util.js";
import AutoPostingEntry, { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import type { AnyGuildTextChannelWithoutThreads } from "oceanic.js";
import FuzzySearch from "fuzzy-search";
import assert from "node:assert";

export default class AutoPostingEntryAutocomplete extends BaseAutocomplete {
    command = "autoposting";
    option = "entry";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const filter = interaction.data.options.raw[0].name === "enable" ? "disabled" :  (interaction.data.options.raw[0].name === "disable" ? "enabled" : undefined);
        const autos = await AutoPostingEntry.getAll(interaction.guild.id, filter);
        const choices = autos.map(a => ({ name: `${Util.readableConstant(AutoPostingTypes[a.type])} in #${interaction.client.getChannel<AnyGuildTextChannelWithoutThreads>(a.channelID)?.name ?? a.channelID}`, value: a.id }));
        const fuzzy = new FuzzySearch(choices, ["name"], { caseSensitive: false });
        const ch = fuzzy.search(focused.value);
        if (filter !== undefined && ch.length !== 0) {
            ch.splice(24, 1, { name: "All", value: "all" });
        }
        return interaction.reply(ch.slice(0, 25));
    }
}
