import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import Util from "../../../util/Util.js";
import { AutoPostingCategories, AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import { assert } from "tsafe";
import FuzzySearch from "fuzzy-search";

export default class AutoPostingTypeAutocomplete extends BaseAutocomplete {
    command = "autoposting";
    option = "type";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const category = interaction.data.options.getString<keyof typeof AutoPostingCategories>("category");
        if (!category) {
            return interaction.result([
                { name: "Select a category first.", value: AutoPostingTypes[AutoPostingTypes.RED_PANDA] }
            ]);
        }
        const search = new FuzzySearch(AutoPostingCategories[category].map(event => ({ name: Util.readableConstant(AutoPostingTypes[event]), value: AutoPostingTypes[event] })), ["name"]);
        return interaction.result(search.search(focused.value));
    }
}
